import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import Assignment from '../models/Assignment.js';
import Recipient from '../models/AssignmentRecipient.js';
import Submission from '../models/AssignmentSubmission.js';
import Evaluation from '../models/AssignmentEvaluation.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import { intervalAt, placementAt } from './enrollmentPlacement.js';
import { authorizeTargets, timestamp } from './learningResources.js';
import { storePdf, removeFile, validatePdf } from './privateStorage.js';
import { onlyFields } from './profileValidation.js';
import { schoolToday } from '../utils/schoolDate.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const id = (value, label = 'identifier') => { if (!mongoose.isObjectIdOrHexString(value)) fail(400, `Invalid ${label}`); return value; };
const reason = value => { if (typeof value !== 'string' || !value.trim() || value.length > 500) fail(400, 'A reason of 1–500 characters is required'); return value.trim(); };
const version = value => { if (!Number.isSafeInteger(value) || value < 0) fail(428, 'Loaded version is required'); };
const staffScope = user => user.role === 'Admin' ? {} : { $or: [{ author: user._id }, { evaluators: user._id }] };
const safeFile = file => file ? { name: file.name, size: file.size, mime: 'application/pdf' } : null;
const snapshot = value => JSON.parse(JSON.stringify(value));
const populate = q => q.populate('academicYear schoolClass subject sections', 'name').populate('author evaluators', 'fullname role');
const mutable = ['title', 'instructions', 'academicYear', 'schoolClass', 'subject', 'sections', 'publishAt', 'dueAt', 'cutoffAt', 'maxMarks', 'allowResubmission'];
function validate(input) {
  onlyFields(input, [...mutable, 'version', 'reason']);
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200) fail(400, 'Title is required (maximum 200 characters)');
  if (typeof input.instructions !== 'string' || input.instructions.length > 10000) fail(400, 'Instructions must be at most 10000 characters');
  for (const key of ['academicYear', 'schoolClass', 'subject']) id(input[key], key);
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 50 || new Set(input.sections).size !== input.sections.length) fail(400, 'Choose 1–50 distinct sections');
  input.sections.forEach(s => id(s, 'section'));
  if (typeof input.allowResubmission !== 'boolean') fail(400, 'Choose a resubmission policy');
  if (typeof input.maxMarks !== 'number' || !Number.isFinite(input.maxMarks) || input.maxMarks < 0 || input.maxMarks > 100000 || Math.abs(input.maxMarks * 100 - Math.round(input.maxMarks * 100)) > 0.00001) fail(400, 'Maximum marks must be 0–100000 with at most two decimal places');
  const publishAt = timestamp(input.publishAt, 'Publication'), dueAt = timestamp(input.dueAt, 'Deadline'), cutoffAt = timestamp(input.cutoffAt, 'Cutoff', true);
  if (dueAt <= publishAt || (cutoffAt && cutoffAt < dueAt)) fail(400, 'Deadline must follow publication; cutoff cannot precede the deadline');
  return { ...Object.fromEntries(mutable.map(k => [k, input[k]])), title: input.title.trim(), publishAt, dueAt, cutoffAt };
}
async function staffRow(user, assignmentId, session = null, lock = false) {
  if (!['Teacher', 'Admin'].includes(user.role)) fail(403, 'Staff permission required');
  const filter = { _id: id(assignmentId), ...staffScope(user) };
  const row = lock ? await Assignment.findOneAndUpdate(filter, { $inc: { lockRevision: 1 } }, { new: true, session, timestamps: false }) : await Assignment.findOne(filter).session(session);
  if (!row) fail(404, 'Assignment not found or not authorized');
  return row;
}
async function capture(row, session) {
  const effectiveDate = schoolToday(row.publishAt), now = new Date();
  const enrollments = await Enrollment.find({ academicYear: row.academicYear, schoolClass: row.schoolClass, section: { $in: row.sections }, ...intervalAt(effectiveDate) }).session(session).lean();
  const initializedLater = await Enrollment.find({ initialized: true, startDate: { $gt: effectiveDate } }).session(session).distinct('student');
  const candidates = await Student.find({ $or: [{ enrollmentManaged: { $ne: true } }, { _id: { $in: initializedLater } }], schoolClass: row.schoolClass, section: { $in: row.sections }, isActive: true }).session(session).lean();
  const legacy = [];
  for (const s of candidates) { const p = await placementAt(s, schoolToday(), session, true); if (p && same(p.schoolClass, row.schoolClass) && row.sections.some(v => same(v, p.section))) legacy.push({ ...s, section: p.section, rollNumber: p.rollNumber }); }
  // Enrollment evidence survives later account deactivation. Account/profile access
  // restrictions are enforced on every request, not by deleting expected recipients.
  const students = await Student.find({ _id: { $in: [...enrollments.map(e => e.student), ...legacy.map(s => s._id)] } }).populate({ path: 'user', select: 'fullname role isActive' }).session(session);
  const recipients = students.filter(s => s.user?.role === 'Student').map(s => {
    const e = enrollments.find(e => same(e.student, s._id)), current = legacy.find(l => same(l._id, s._id));
    return { assignment: row._id, student: s._id, user: s.user._id, name: s.user.fullname, admissionNo: s.admissionNo, section: e?.section || current.section, rollNumber: e?.rollNumber || current.rollNumber, evidence: e ? 'enrollment-at-publication' : 'current-placement-snapshot', effectiveDate: e ? effectiveDate : schoolToday(now), capturedAt: now, ...(e ? { enrollment: e._id } : {}) };
  });
  if (recipients.length) await Recipient.insertMany(recipients, { session });
  row.activatedAt = now; row.revision++; row.audit.push({ actor: row.author, action: 'Recipient snapshot captured', reason: 'Effective-dated enrollment at publication; unmanaged profiles use explicitly labeled current placement only', after: { count: recipients.length, currentSnapshots: recipients.filter(r => r.evidence === 'current-placement-snapshot').length } });
  await row.save({ session });
}
// Scheduled recipients are materialized on first authorized access, resolving the publication date from enrollment history.
export async function activateAssignments() {
  const due = await Assignment.find({ state: 'published', publishAt: { $lte: new Date() }, activatedAt: null }).select('_id');
  for (const a of due) await transaction(async session => {
    const row = await Assignment.findOneAndUpdate({ _id: a._id, state: 'published', publishAt: { $lte: new Date() }, activatedAt: null }, { $inc: { lockRevision: 1 } }, { new: true, session, timestamps: false });
    if (row) await capture(row, session);
  });
}
export async function createAssignment(user, input, file, internalId) {
  if (!['Admin', 'Teacher'].includes(user.role)) fail(403, 'Staff permission required');
  const data = validate(input); await authorizeTargets(user, data);
  const stored = file ? await storePdf(file) : undefined;
  let row;
  try { row = await Assignment.create({ ...(internalId ? { _id: internalId } : {}), ...data, author: user._id, file: stored, audit: [{ actor: user._id, action: 'Draft created' }] }); }
  catch (e) { if (stored && !await Assignment.exists({ 'file.key': stored.key })) await removeFile(stored.key); throw e; }
  return assignmentDetail(user, row._id);
}
export async function editAssignment(user, assignmentId, input) {
  const data = validate(input); version(input.version);
  await activateAssignments();
  await transaction(async session => {
    const row = await staffRow(user, assignmentId, session, true);
    if (row.revision !== input.version) fail(409, 'Assignment changed. Reload before saving');
    if (row.state === 'archived') fail(409, 'Archived assignments are read-only');
    if (row.audienceLocked) {
      if (['academicYear', 'schoolClass', 'subject'].some(k => !same(row[k], data[k])) || row.sections.map(String).sort().join() !== data.sections.slice().sort().join() || row.publishAt.getTime() !== data.publishAt.getTime() || row.maxMarks !== data.maxMarks) fail(400, 'Published targets, publication time and maximum marks are immutable');
      reason(input.reason);
      if (data.dueAt < row.dueAt || (data.cutoffAt && (!row.cutoffAt || data.cutoffAt < row.cutoffAt)) || (row.allowResubmission && !data.allowResubmission)) fail(400, 'Published deadlines and submission permissions may only be extended');
    } else await authorizeTargets(user, data);
    const before = snapshot(Object.fromEntries(mutable.map(k => [k, row[k]])));
    Object.assign(row, data); row.revision++; row.audit.push({ actor: user._id, action: 'Assignment edited', reason: input.reason || '', before, after: data }); await row.save({ session });
  });
  return assignmentDetail(user, assignmentId);
}
export async function assignmentAction(user, assignmentId, input) {
  onlyFields(input, ['action', 'version', 'reason', 'evaluator', 'student']); version(input.version);
  await activateAssignments();
  await transaction(async session => {
    const row = await staffRow(user, assignmentId, session, true);
    if (row.revision !== input.version) fail(409, 'Assignment changed. Reload before acting');
    const before = { state: row.state, evaluators: row.evaluators.map(String) };
    if (input.action === 'publish') {
      if (row.state !== 'draft') fail(409, 'Only drafts can be published');
      await authorizeTargets(user, row); row.state = 'published'; row.audienceLocked = true;
      if (row.publishAt <= new Date()) await capture(row, session);
    } else if (input.action === 'close') {
      if (row.state !== 'published') fail(409, 'Only published assignments can be closed');
      row.state = 'closed'; reason(input.reason);
    } else if (input.action === 'archive') { row.state = 'archived'; reason(input.reason); }
    else if (['delegate', 'revoke'].includes(input.action)) {
      if (user.role !== 'Admin') fail(403, 'Only Admin can explicitly delegate evaluation');
      reason(input.reason); id(input.evaluator, 'evaluator');
      if (input.action === 'delegate') {
        if (!await User.exists({ _id: input.evaluator, role: 'Teacher', isActive: true }).session(session) || !await Teacher.exists({ user: input.evaluator, isActive: true }).session(session)) fail(400, 'Choose an active Teacher account');
        if (!row.evaluators.some(e => same(e, input.evaluator))) row.evaluators.push(input.evaluator);
      } else row.evaluators = row.evaluators.filter(e => !same(e, input.evaluator));
    } else if (input.action === 'add-recipient') {
      reason(input.reason); id(input.student, 'student');
      if (!row.activatedAt || row.state !== 'published') fail(409, 'Explicit additions require an available published assignment');
      const s = await Student.findOne({ _id: input.student, isActive: true }).populate('user', 'fullname role isActive').session(session);
      const p = await placementAt(s, schoolToday(), session, true);
      if (!s?.user?.isActive || s.user.role !== 'Student' || !p || !same(p.schoolClass, row.schoolClass) || !row.sections.some(v => same(v, p.section))) fail(400, 'Student must currently belong to a target section');
      if (await Recipient.exists({ assignment: row._id, student: s._id }).session(session)) fail(409, 'Student is already a recipient');
      await Recipient.create([{ assignment: row._id, student: s._id, user: s.user._id, name: s.user.fullname, admissionNo: s.admissionNo, section: p.section, rollNumber: p.rollNumber, evidence: 'explicit-addition', effectiveDate: schoolToday() }], { session });
    } else fail(400, 'Unknown action');
    row.revision++; row.audit.push({ actor: user._id, action: input.action, reason: input.reason || '', before, after: { state: row.state, evaluators: row.evaluators.map(String), student: input.student } }); await row.save({ session });
  });
  return assignmentDetail(user, assignmentId);
}
export const submissionStatus = (submission, evaluation) => !submission ? 'Not submitted' : evaluation?.published?.action === 'returned' ? 'Returned for revision' : evaluation?.published?.action === 'graded' ? 'Graded' : submission.late ? 'Submitted late' : 'Submitted';
function safeEvaluation(e, user) {
  if (!e) return null;
  if (user.role === 'Student') return e.published?.action ? { published: e.published } : null;
  return e;
}
async function visible(user, assignmentId) {
  id(assignmentId); await activateAssignments();
  if (user.role !== 'Student') return staffRow(user, assignmentId);
  const row = await Assignment.findById(assignmentId);
  if (!row?.activatedAt || !await Recipient.exists({ assignment: assignmentId, user: user._id })) fail(404, 'Assignment not available');
  return row;
}
export async function assignmentDetail(user, assignmentId) {
  const row = await visible(user, assignmentId);
  const result = (await populate(Assignment.findById(row._id)).populate('audit.actor', 'fullname role')).toObject();
  result.file = safeFile(result.file); delete result.lockRevision;
  const recipients = await Recipient.find({ assignment: row._id, ...(user.role === 'Student' ? { user: user._id } : {}) }).populate('section', 'name').sort({ name: 1 }).lean();
  const submissions = await Submission.find({ recipient: { $in: recipients.map(r => r._id) } }).sort({ sequence: -1 }).lean();
  const evaluations = await Evaluation.find({ submission: { $in: submissions.map(s => s._id) } }).populate('audit.actor published.actor', 'fullname role').lean();
  result.recipients = recipients.map(r => {
    const history = submissions.filter(s => same(s.recipient, r._id)).map(s => { const { fingerprint, idempotencyKey, ...safe } = s; void fingerprint; void idempotencyKey; return { ...safe, file: safeFile(s.file), evaluation: safeEvaluation(evaluations.find(e => same(e.submission, s._id)), user) }; });
    return { ...r, history, status: submissionStatus(history[0], history[0]?.evaluation) };
  });
  if (user.role === 'Student') { delete result.audit; delete result.evaluators; delete result.__v; delete result.revision; }
  result.timeZone = process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata';
  return result;
}
export async function submitAssignment(user, assignmentId, input, file, key) {
  if (user.role !== 'Student') fail(403, 'Only Students can submit their own work');
  id(assignmentId); onlyFields(input, ['text', 'expectedSequence', 'confirmed']);
  if (input.confirmed !== true) fail(400, 'Confirm final submission');
  if (typeof input.text !== 'string' || input.text.length > 20000 || (!input.text.trim() && !file)) fail(400, 'Include text (maximum 20000 characters) or a PDF');
  if (!Number.isSafeInteger(input.expectedSequence) || input.expectedSequence < 0) fail(428, 'Loaded submission sequence is required');
  if (typeof key !== 'string' || !/^[A-Za-z0-9:_-]{8,128}$/.test(key)) fail(400, 'Send a stable Idempotency-Key');
  if (file) validatePdf(file);
  const fingerprint = createHash('sha256').update(JSON.stringify({ assignmentId: String(assignmentId), ...input, file: file ? { name: file.originalname, hash: createHash('sha256').update(file.buffer).digest('hex') } : null })).digest('hex');
  const match = old => { if (old.fingerprint !== fingerprint) fail(409, 'Idempotency key was used for different work'); return { submissionId: old._id, sequence: old.sequence }; };
  const existing = await Submission.findOne({ user: user._id, idempotencyKey: key }); if (existing) return match(existing);
  await activateAssignments(); const stored = file ? await storePdf(file) : undefined;
  let retained = false;
  try {
    const result = await transaction(async session => {
      const old = await Submission.findOne({ user: user._id, idempotencyKey: key }).session(session); if (old) return match(old);
      const row = await Assignment.findOneAndUpdate({ _id: assignmentId }, { $inc: { lockRevision: 1 } }, { new: true, session, timestamps: false });
      const r = await Recipient.findOne({ assignment: assignmentId, user: user._id }).session(session), now = new Date();
      if (!row || !r) fail(404, 'Assignment not available');
      if (row.state !== 'published' || row.publishAt > now || (row.cutoffAt && now > row.cutoffAt)) fail(409, 'Submission is closed or not yet available');
      if (r.sequence !== input.expectedSequence) fail(409, 'A newer submission exists. Reload before submitting');
      const evaluation = r.head ? await Evaluation.findOne({ submission: r.head }).session(session) : null;
      if (r.sequence && !row.allowResubmission && evaluation?.published?.action !== 'returned') fail(409, 'Resubmission is not permitted unless returned for revision');
      const [s] = await Submission.create([{ assignment: row._id, recipient: r._id, user: user._id, sequence: r.sequence + 1, text: input.text.trim(), file: stored, submittedAt: now, late: now > row.dueAt, dueAt: row.dueAt, cutoffAt: row.cutoffAt, assignmentRevision: row.revision, idempotencyKey: key, fingerprint }], { session });
      r.head = s._id; r.sequence++; await r.save({ session }); return { submissionId: s._id, sequence: s.sequence, created: true };
    });
    retained = Boolean(result.created); return result;
  } catch (e) {
    if (e.code === 11000) { const old = await Submission.findOne({ user: user._id, idempotencyKey: key }); if (old) return match(old); }
    throw e;
  } finally { if (stored && !retained && !await Submission.exists({ 'file.key': stored.key })) await removeFile(stored.key); }
}
export async function evaluateSubmission(user, assignmentId, submissionId, input) {
  onlyFields(input, ['version', 'action', 'score', 'feedback', 'reason']); version(input.version); id(submissionId);
  if (!['draft', 'publish', 'return'].includes(input.action)) fail(400, 'Choose draft, publish or return');
  if (typeof input.feedback !== 'string' || input.feedback.length > 10000) fail(400, 'Feedback must be at most 10000 characters');
  await transaction(async session => {
    const row = await staffRow(user, assignmentId, session, true);
    if (row.state === 'archived') fail(409, 'Archived assignments are read-only');
    const s = await Submission.findOne({ _id: submissionId, assignment: row._id }).session(session);
    if (!s) fail(404, 'Submission not found');
    const r = await Recipient.findById(s.recipient).session(session);
    if (!same(r.head, s._id)) fail(409, 'This is an older submission version. Review the current version');
    let e = await Evaluation.findOne({ submission: s._id }).session(session);
    if ((e?.revision || 0) !== input.version) fail(409, 'Evaluation changed. Reload before saving');
    const score = input.score;
    if (score != null && (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > row.maxMarks || Math.abs(score * 100 - Math.round(score * 100)) > 0.00001)) fail(400, 'Score must be within maximum marks, with at most two decimals');
    if (input.action === 'publish' && score == null) fail(400, 'A score is required to publish a grade');
    if (input.action === 'return' && !input.feedback.trim()) fail(400, 'Give revision instructions');
    if (e?.published?.action && input.action !== 'draft') reason(input.reason);
    if (!e) e = new Evaluation({ submission: s._id });
    const before = snapshot({ draft: e.draft, published: e.published });
    e.draft = { score: score ?? undefined, feedback: input.feedback };
    if (input.action !== 'draft') e.published = { action: input.action === 'return' ? 'returned' : 'graded', ...(input.action === 'publish' ? { score } : {}), feedback: input.feedback, at: new Date(), actor: user._id };
    e.revision = (e.revision || 0) + 1; e.audit.push({ actor: user._id, action: input.action, reason: input.reason || '', before, after: snapshot({ draft: e.draft, published: e.published }) }); await e.save({ session });
  });
  return assignmentDetail(user, assignmentId);
}
export async function assignmentFile(user, assignmentId, submissionId) {
  const row = await visible(user, assignmentId);
  if (!submissionId) { if (!row.file) fail(404, 'No assignment PDF'); return row.file; }
  id(submissionId);
  const s = await Submission.findOne({ _id: submissionId, assignment: row._id, ...(user.role === 'Student' ? { user: user._id } : {}) });
  if (!s?.file) fail(404, 'Submission PDF not available'); return s.file;
}
export async function assignmentList(user, query = {}) {
  for (const v of Object.values(query)) if (typeof v !== 'string') fail(400, 'Invalid filter');
  await activateAssignments();
  const filter = user.role === 'Student' ? { _id: { $in: await Recipient.find({ user: user._id }).distinct('assignment') } } : staffScope(user);
  for (const k of ['academicYear', 'schoolClass', 'subject', 'author']) if (query[k]) filter[k] = id(query[k], k);
  if (query.section) filter.sections = id(query.section, 'section');
  if (query.state) { if (!['draft', 'published', 'closed', 'archived'].includes(query.state)) fail(400, 'Invalid state'); filter.state = query.state; }
  if (query.search) filter.title = { $regex: query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (query.deadline) { if (!['upcoming', 'past'].includes(query.deadline)) fail(400, 'Invalid deadline filter'); filter.dueAt = { [query.deadline === 'past' ? '$lt' : '$gte']: new Date() }; }
  let rows = await populate(Assignment.find(filter).select('-audit -lockRevision -file.key -file.sha256').sort({ dueAt: 1, _id: 1 })).lean();
  const recipients = await Recipient.find({ assignment: { $in: rows.map(r => r._id) }, ...(user.role === 'Student' ? { user: user._id } : {}) }).lean();
  const submissions = await Submission.find({ _id: { $in: recipients.map(r => r.head).filter(Boolean) } }).select('_id late sequence').lean();
  const evaluations = await Evaluation.find({ submission: { $in: submissions.map(s => s._id) } }).select('submission published').lean();
  rows = rows.map(row => {
    const roster = recipients.filter(r => same(r.assignment, row._id)).map(r => { const s = submissions.find(s => same(s._id, r.head)), e = evaluations.find(e => same(e.submission, s?._id)); return { status: submissionStatus(s, e), resubmitted: s?.sequence > 1, newFeedback: Boolean(e?.published?.at && (!r.feedbackSeenAt || e.published.at > r.feedbackSeenAt)) }; });
    const stats = { recipients: roster.length, notSubmitted: roster.filter(r => r.status === 'Not submitted').length, pending: roster.filter(r => ['Submitted', 'Submitted late'].includes(r.status)).length, returned: roster.filter(r => r.status === 'Returned for revision').length, resubmitted: roster.filter(r => r.resubmitted && ['Submitted', 'Submitted late'].includes(r.status)).length, graded: roster.filter(r => r.status === 'Graded').length, newFeedback: roster.filter(r => r.newFeedback).length };
    if (user.role === 'Student') { delete row.evaluators; delete row.__v; delete row.revision; }
    return { ...row, stats, status: user.role === 'Student' ? roster[0]?.status : row.state };
  });
  const optionRows = await populate(Assignment.find(user.role === 'Student' ? { _id: { $in: await Recipient.find({ user: user._id }).distinct('assignment') } } : staffScope(user)).select('academicYear schoolClass subject sections')).lean();
  const unique = values => [...new Map(values.filter(Boolean).map(v => [String(v._id), v])).values()];
  const filterOptions = { years: unique(optionRows.map(r => r.academicYear)), classes: unique(optionRows.map(r => ({ ...r.schoolClass, academicYear: r.academicYear?._id }))), subjects: unique(optionRows.map(r => ({ ...r.subject, schoolClass: r.schoolClass?._id }))), sections: unique(optionRows.flatMap(r => r.sections.map(s => ({ ...s, schoolClass: r.schoolClass?._id })))) };
  if (query.status) rows = rows.filter(r => r.status === query.status);
  const pageSize = Number(query.limit || 12), requested = Number(query.page || 1);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || !Number.isInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const total = rows.length, totalPages = Math.max(1, Math.ceil(total / pageSize)), page = Math.min(requested, totalPages);
  const summary = rows.reduce((a, r) => { for (const k of Object.keys(r.stats)) a[k] = (a[k] || 0) + r.stats[k]; if (r.state === 'published' && r.dueAt >= new Date()) a.upcoming++; return a; }, { upcoming: 0 });
  const upcoming = rows.filter(r => r.state === 'published' && r.dueAt >= new Date()).slice(0, 3).map(r => ({ _id: r._id, title: r.title, dueAt: r.dueAt }));
  return { records: rows.slice((page - 1) * pageSize, page * pageSize), summary, upcoming, filterOptions, pagination: { total, totalPages, page, limit: pageSize }, timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' };
}
export async function markFeedbackSeen(user, assignmentId) {
  if (user.role !== 'Student') fail(403, 'Student permission required');
  await visible(user, assignmentId); await Recipient.updateOne({ assignment: assignmentId, user: user._id }, { $set: { feedbackSeenAt: new Date() } }); return { seen: true };
}
export async function recipientCandidates(user, assignmentId) {
  const row = await staffRow(user, assignmentId);
  const enrolled = await Enrollment.find({ academicYear: row.academicYear, schoolClass: row.schoolClass, section: { $in: row.sections }, ...intervalAt(schoolToday()) }).distinct('student');
  const existing = await Recipient.find({ assignment: row._id }).distinct('student');
  const accounts = await User.find({ role: 'Student', isActive: true }).distinct('_id');
  return Student.find({ _id: { $nin: existing }, isActive: true, user: { $in: accounts }, $or: [{ _id: { $in: enrolled } }, { enrollmentManaged: { $ne: true }, schoolClass: row.schoolClass, section: { $in: row.sections } }] }).select('user admissionNo').populate('user', 'fullname').lean();
}
