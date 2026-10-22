import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ReportCard from '../models/ReportCard.js';
import Publication from '../models/ExamPublication.js';
import Exam from '../models/Exam.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
import { onlyFields } from './profileValidation.js';
import { privatePath, storePdf, removeFile } from './privateStorage.js';
import { renderReportCard, schoolIdentity, TEMPLATE_VERSION } from './reportCardPdf.js';
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const clone = v => JSON.parse(JSON.stringify(v));
const oid = v => { if (!mongoose.isObjectIdOrHexString(v)) fail(400, 'Invalid report identifier'); return v; };
const admin = u => { if (u.role !== 'Admin') fail(403, 'Admin report-card permission required'); };
function sourceVersion(v) { if (!Number.isInteger(v) || v < 1) fail(400, 'Choose an explicit published result version'); return v; }
function inputOptions(input) {
  onlyFields(input, ['publication', 'candidate', 'remarks', 'reason']);
  for (const [key, limit] of [['remarks', 2000], ['reason', 500]]) if (input[key] != null && (typeof input[key] !== 'string' || input[key].length > limit)) fail(400, `Invalid ${key}`);
  return { remarks: (input.remarks || '').trim(), reason: (input.reason || '').trim() };
}
const publicCard = c => ({ _id: c._id, exam: c.exam, publication: c.publication, candidate: c.candidate, academicYear: c.academicYear, schoolClass: c.schoolClass, section: c.section, sourceVersion: c.sourceVersion, issueNumber: c.issueNumber, issuedAt: c.issuedAt, issueDate: c.snapshot.issueDate, timeZone: c.snapshot.timeZone, actor: c.actor, reason: c.reason, remarks: c.remarks, templateVersion: c.templateVersion, previous: c.previous, name: c.snapshot.result.name, examName: c.snapshot.examName, academicYearName: c.snapshot.academicYearName, className: c.snapshot.result.className, sectionName: c.snapshot.result.sectionName, admissionNo: c.snapshot.result.admissionNo });
export async function reportSources(user, query = {}) {
  admin(user);
  const filter = {};
  if (query.academicYear) filter['payload.academicYear'] = String(oid(query.academicYear));
  const rows = await Publication.find(filter).select('exam version createdAt payload.name payload.academicYear payload.academicYearName').sort({ createdAt: -1 }).lean();
  return rows.map(p => ({ _id: p._id, exam: p.exam, version: p.version, name: p.payload.name, academicYear: p.payload.academicYear, academicYearName: p.payload.academicYearName, publishedAt: p.createdAt }));
}
export async function reportCandidates(user, id, query = {}) {
  admin(user);
  const p = await Publication.findById(oid(id)).lean(); if (!p) fail(404, 'Published source not found');
  const cards = await ReportCard.find({ exam: p.exam }).sort({ sourceVersion: -1 }).lean();
  const results = p.payload.results.filter(r => (!query.schoolClass || same(r.schoolClass, query.schoolClass)) && (!query.section || same(r.section, query.section)));
  const sections = [...new Map(p.payload.results.map(r => [r.section, { _id: r.section, schoolClass: r.schoolClass, name: r.sectionName, className: r.className }])).values()];
  return { publication: { _id: p._id, version: p.version, name: p.payload.name, academicYearName: p.payload.academicYearName }, sections, candidates: results.map(r => { const own = cards.filter(c => same(c.candidate, r._id)), issued = own.find(c => same(c.publication, p)); return { _id: r._id, name: r.name, admissionNo: r.admissionNo, className: r.className, sectionName: r.sectionName, rollNumber: r.rollNumber, schoolClass: r.schoolClass, section: r.section, card: issued ? publicCard(issued) : null, latest: own[0] ? publicCard(own[0]) : null }; }) };
}
export async function issueReportCard(user, input) {
  admin(user); const options = inputOptions(input), publicationId = oid(input.publication), candidateId = oid(input.candidate);
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...options, templateVersion: TEMPLATE_VERSION })).digest('hex');
  const existing = await ReportCard.findOne({ publication: publicationId, candidate: candidateId }).lean();
  const retry = row => { if (row.fingerprint !== fingerprint) fail(409, 'This source already has an issued card with different remarks/reason/template. Download the retained card; reissue requires a corrected publication'); return publicCard(row); };
  if (existing) return retry(existing);
  const p = await Publication.findById(publicationId).lean(); if (!p) fail(404, 'Explicit published source not found'); sourceVersion(p.version);
  const result = p.payload.results.find(r => same(r._id, candidateId)); if (!result) fail(404, 'Candidate not in this publication');
  const previous = await ReportCard.findOne({ exam: p.exam, candidate: candidateId }).sort({ sourceVersion: -1 }).lean();
  if (previous && previous.sourceVersion >= p.version) fail(409, 'A newer card is already issued; older publications cannot replace it');
  if (previous && !options.reason) fail(400, 'A reissue reason is required for the corrected publication');
  const id = new mongoose.Types.ObjectId(), issuedAt = new Date(), issueNumber = (previous?.issueNumber || 0) + 1;
  const snapshot = { documentId: String(id), issueNumber, issuedAt: issuedAt.toISOString(), issueDate: new Intl.DateTimeFormat('en-GB', { timeZone: p.payload.timeZone, dateStyle: 'long' }).format(issuedAt), actorName: user.fullname, school: await schoolIdentity(), templateVersion: TEMPLATE_VERSION, examName: p.payload.name, academicYearName: p.payload.academicYearName, academicYear: p.payload.academicYear, publication: String(p._id), sourceVersion: p.version, publishedAt: p.createdAt, timeZone: p.payload.timeZone, result: clone(result), components: clone(p.payload.components.filter(c => result.marks.some(m => same(m.component, c._id))).map(c => ({ _id: c._id, name: c.name, subjectName: c.subjectName }))), policy: clone(p.payload.policy), remarks: options.remarks, reason: options.reason, previous: previous ? String(previous._id) : null };
  const buffer = await renderReportCard(snapshot), file = await storePdf({ originalname: `report-card-${id}.pdf`, mimetype: 'application/pdf', buffer });
  let kept = false, commitConfirmed = false;
  try {
    const card = await transaction(async session => {
      // The same exam lock used by approval/publication serializes issue/reissue commits.
      await Exam.updateOne({ _id: p.exam }, { $inc: { lockRevision: 1 } }, { session, timestamps: false });
      const winner = await ReportCard.findOne({ publication: p._id, candidate: candidateId }).session(session).lean(); if (winner) return retry(winner);
      const latest = await ReportCard.findOne({ exam: p.exam, candidate: candidateId }).sort({ sourceVersion: -1 }).session(session).lean();
      if (!same(latest?._id, previous?._id)) fail(409, 'Issued history changed during generation. Reload and retry');
      const [created] = await ReportCard.create([{ _id: id, publication: p._id, exam: p.exam, candidate: candidateId, user: result.user, sourceVersion: p.version, academicYear: result.academicYear, schoolClass: result.schoolClass, section: result.section, issueNumber, actor: user._id, issuedAt, ...options, templateVersion: TEMPLATE_VERSION, previous: previous?._id || null, fingerprint, snapshot, file }], { session });
      return publicCard(created);
    });
    commitConfirmed = true; kept = same(card._id, id); return card;
  } finally {
    // Only a confirmed successful duplicate may discard its losing artifact. Any DB
    // error (including ambiguous commit) leaves the file for age-gated cleanup.
    if (commitConfirmed && !kept) { try { if (!await ReportCard.exists({ 'file.key': file.key })) await removeFile(file.key); } catch { /* retained safely */ } }
  }
}
export async function issueBatch(user, input) {
  admin(user); onlyFields(input, ['publication', 'candidates', 'remarks', 'reason']); oid(input.publication);
  if (!Array.isArray(input.candidates) || !input.candidates.length || input.candidates.length > 25 || new Set(input.candidates).size !== input.candidates.length) fail(400, 'Select 1-25 distinct candidates per batch');
  const outcomes = [];
  for (const candidate of input.candidates) { try { outcomes.push({ candidate, ok: true, card: await issueReportCard(user, { publication: input.publication, candidate, remarks: input.remarks, reason: input.reason }) }); } catch (e) { outcomes.push({ candidate, ok: false, error: e.status && e.status < 500 ? e.message : 'Generation unavailable. Retry this candidate safely', status: e.status || 500 }); } }
  return { outcomes, completed: outcomes.length, issued: outcomes.filter(r => r.ok).length };
}
export async function listReportCards(user, query = {}) {
  if (!['Admin', 'Student'].includes(user.role)) fail(403, 'Report-card access denied');
  const filter = user.role === 'Student' ? { user: user._id } : {};
  const all = await ReportCard.find(filter).sort({ issuedAt: -1 }).populate('actor', 'fullname').lean();
  const versions = await Publication.find({ exam: { $in: all.map(c => c.exam) } }).select('exam version').lean();
  const records = all.filter(c => (!query.academicYear || same(c.academicYear, query.academicYear)) && (!query.exam || same(c.exam, query.exam))).map(c => ({ ...publicCard(c), superseded: all.some(v => same(v.exam, c.exam) && same(v.candidate, c.candidate) && v.sourceVersion > c.sourceVersion), newerResultAvailable: versions.some(v => same(v.exam, c.exam) && v.version > c.sourceVersion) }));
  return { records, years: [...new Map(all.map(c => [String(c.academicYear), { _id: c.academicYear, name: c.snapshot.academicYearName }])).values()], exams: [...new Map(all.map(c => [String(c.exam), { _id: c.exam, name: c.snapshot.examName }])).values()] };
}
export async function ownedCard(user, id) {
  if (!['Admin', 'Student'].includes(user.role)) fail(403, 'Report-card access denied');
  const c = await ReportCard.findOne({ _id: oid(id), ...(user.role === 'Student' ? { user: user._id } : {}) }).lean(); if (!c) fail(404, 'Issued report card not found'); return c;
}
export async function cardBytes(user, id) {
  const card = await ownedCard(user, id); let buffer;
  try { buffer = await fs.readFile(await privatePath(card.file.key)); } catch { fail(503, 'Issued PDF unavailable. Restore the matching private artifact from backup; it will not be regenerated'); }
  if (buffer.length !== card.file.size || createHash('sha256').update(buffer).digest('hex') !== card.file.sha256) fail(503, 'Issued PDF integrity check failed. Restore the matching backup');
  return { card, buffer };
}
