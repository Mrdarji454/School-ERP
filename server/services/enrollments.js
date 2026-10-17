import mongoose from 'mongoose';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import Enrollment from '../models/Enrollment.js';
import EnrollmentTransition from '../models/EnrollmentTransition.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AcademicYear from '../models/AcademicYear.js';
import Section from '../models/Section.js';
import Attendance from '../models/Attendance.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import { transaction } from '../utils/transaction.js';
import { classSection, same } from '../utils/relationships.js';
import { schoolDate, schoolToday } from '../utils/schoolDate.js';
import { onlyFields } from './profileValidation.js';
import { fail } from '../utils/errors.js';
import { intervalAt } from './enrollmentPlacement.js';
export const nextDate = date => new Date(date.getTime() + 86400000);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const types = ['admission', 'transfer', 'promotion', 'repeat', 'withdrawal', 'completion'];
const ending = type => ['withdrawal', 'completion'].includes(type);
function objectId(value, label) { if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) fail(400, `Invalid ${label}`); return value; }
export function transitionInput(input) {
  onlyFields(input, ['student', 'type', 'effectiveDate', 'academicYear', 'schoolClass', 'section', 'rollNumber', 'reason', 'transitionId', 'expectedRevision', 'sourceEnrollment']);
  objectId(input.student, 'student');
  if (!types.includes(input.type)) fail(400, 'Choose an explicit transition type');
  if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 500) fail(400, 'A reason is required (maximum 500 characters)');
  if (typeof input.transitionId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.transitionId)) fail(400, 'A stable transition identifier is required');
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) fail(428, 'Load the student enrollment revision before previewing');
  const date = schoolDate(input.effectiveDate);
  if (date > schoolToday()) fail(400, 'Future effective dates are not supported; run the transition on or after its effective school date');
  const data = { student: input.student, type: input.type, effectiveDate: date.toISOString().slice(0, 10), reason: input.reason.trim(), transitionId: input.transitionId, expectedRevision: input.expectedRevision };
  if (input.sourceEnrollment) data.sourceEnrollment = objectId(input.sourceEnrollment, 'source enrollment');
  if (!ending(input.type)) {
    for (const key of ['academicYear', 'schoolClass', 'section']) data[key] = objectId(input[key], key);
    if (!Number.isSafeInteger(Number(input.rollNumber)) || Number(input.rollNumber) < 1) fail(400, 'Roll number must be a positive integer'); data.rollNumber = Number(input.rollNumber);
  } else if (['academicYear', 'schoolClass', 'section', 'rollNumber'].some(k => input[k] !== undefined && input[k] !== '')) fail(400, 'An exit transition has no destination');
  return data;
}
export async function legacyRollIndexes() {
  const indexes = await Student.collection.indexes().catch(e => { if (e.code === 26) return []; throw e; });
  return indexes.filter(i => i.unique && Object.keys(i.key).length === 3 && ['schoolClass', 'section', 'rollNumber'].every(k => i.key[k] === 1));
}
async function assertIndexReady() { if ((await legacyRollIndexes()).length) fail(503, 'Legacy scoped-roll index must be explicitly transitioned by the enrollment initialization tool before transitions'); }
export async function checkEnrollmentSlot(data, session, exclude) {
  const overlap = { startDate: { $lt: data.endDate }, endDate: { $gt: data.startDate }, ...(exclude ? { _id: { $ne: exclude } } : {}) };
  if (await Enrollment.exists({ student: data.student, ...overlap }).session(session)) fail(409, 'Student enrollment intervals overlap');
  if (await Enrollment.exists({ academicYear: data.academicYear, schoolClass: data.schoolClass, section: data.section, rollNumber: data.rollNumber, ...overlap }).session(session)) fail(409, 'Roll number is occupied during this interval');
  // Uninitialized legacy placements reserve their roll until explicitly resolved.
  if (await Student.exists({ _id: { $ne: data.student }, enrollmentManaged: { $ne: true }, schoolClass: data.schoolClass, section: data.section, rollNumber: data.rollNumber }).session(session)) fail(409, 'Roll is reserved by an unresolved legacy student');
}
async function destination(data, session) {
  const cls = await classSection(data.schoolClass, data.section, session);
  if (!same(cls.academicYear, data.academicYear)) fail(400, 'Destination class and academic year differ');
  const year = await AcademicYear.findById(data.academicYear).session(session), date = schoolDate(data.effectiveDate);
  if (date < year.startDate || date > year.endDate) fail(400, 'Effective date must be inside the destination academic year');
  return { student: data.student, academicYear: cls.academicYear, schoolClass: cls._id, section: data.section, rollNumber: data.rollNumber, startDate: date, endDate: nextDate(year.endDate) };
}
export async function impactCheck(student, date, target, session = null) {
  const records = await Attendance.find({ 'students.student': student, attendanceDate: { $gte: date } }).select('teacherAssignment attendanceDate isLocked isActive').session(session).lean();
  const assignments = await TeacherAssignment.find({ _id: { $in: records.map(r => r.teacherAssignment) } }).session(session).lean();
  for (const record of records) {
    const a = assignments.find(a => same(a._id, record.teacherAssignment));
    if (!target || record.attendanceDate < target.startDate || record.attendanceDate >= target.endDate || !a || !same(a.academicYear, target.academicYear) || !same(a.schoolClass, target.schoolClass) || !same(a.section, target.section)) fail(409, 'Transition would invalidate recorded attendance (including locked/inactive history); choose a later date');
  }
  return { recordedEntries: records.length, unresolvedHistory: Boolean(await Attendance.exists({ 'students.student': student, attendanceDate: { $lt: date } }).session(session)) };
}
async function plan(data, actor, session = null, lock = false) {
  const fingerprint = hash({ ...data, actor: String(actor._id) });
  const done = await EnrollmentTransition.findOne({ transitionId: data.transitionId }).session(session);
  if (done) { if (done.fingerprint !== fingerprint) fail(409, 'Transition identifier was used for different input or actor'); return { done, fingerprint }; }
  const student = await Student.findById(data.student).session(session);
  if (!student) fail(404, 'Student not found');
  if (!student.enrollmentManaged) fail(409, 'Legacy history is unresolved. Initialize this student with an explicit cutover before transitions');
  if ((student.enrollmentRevision || 0) !== data.expectedRevision) fail(409, 'Enrollment changed since it was loaded; reload and preview again');
  if (lock) await Student.updateOne({ _id: student._id }, { $inc: { __v: 1 } }, { session });
  const previous = await Enrollment.findOne({ student: student._id }).sort({ startDate: -1 }).session(session);
  if (data.sourceEnrollment && !same(previous?._id, data.sourceEnrollment)) fail(409, 'Selected source enrollment is no longer the latest placement');
  const date = schoolDate(data.effectiveDate), target = ending(data.type) ? null : await destination(data, session);
  if (!previous && data.type !== 'admission') fail(409, 'Admission placement is required first');
  if (previous) {
    if (date <= previous.startDate) fail(400, 'Transition must be after the latest enrollment start; zero-length or earlier intervals are not supported');
    if (['withdrawn', 'completed'].includes(previous.status) && data.type !== 'admission') fail(409, 'A new admission is required after withdrawal/completion');
    if (data.type === 'admission' && previous.endDate > date) fail(409, 'An enrollment already covers the admission date');
    if (data.type === 'transfer' && (!same(previous.academicYear, data.academicYear) || date >= previous.endDate)) fail(400, 'Transfer must remain inside the source academic year and interval');
    if (['promotion', 'repeat'].includes(data.type)) {
      const sourceYear = await AcademicYear.findById(previous.academicYear).session(session), destYear = await AcademicYear.findById(data.academicYear).session(session);
      if (!sourceYear || same(sourceYear._id, destYear._id) || destYear.startDate <= sourceYear.endDate || date < previous.endDate) fail(400, 'Promotion/repeat requires a later, non-overlapping academic year after the source enrollment ends');
    }
    if (ending(data.type) && date > previous.endDate) fail(400, 'Exit date must not be later than the source exclusive end');
  }
  if (lock) for (const section of [...new Set([previous?.section, target?.section].filter(Boolean).map(String))].sort()) await Section.updateOne({ _id: section }, { $inc: { __v: 1 } }, { session });
  const impact = await impactCheck(student._id, date, target, session);
  if (target) await checkEnrollmentSlot(target, session, previous?._id);
  return { student, previous, target, date, impact, fingerprint };
}
const sign = text => createHmac('sha256', process.env.JWT_SECRET).update(text).digest('hex');
function tokenFor(data, actor) { const payload = Buffer.from(JSON.stringify({ data, actor: String(actor._id), expires: Date.now() + 15 * 60 * 1000 })).toString('base64url'); return `${payload}.${sign(payload)}`; }
function tokenData(token, actor) {
  if (typeof token !== 'string' || token.length > 10000) fail(400, 'Preview token is required');
  const [payload, signature] = token.split('.');
  if (!/^[a-f0-9]{64}$/.test(signature || '') || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) fail(400, 'Invalid preview token');
  let parsed; try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { fail(400, 'Invalid preview token'); }
  if (parsed.actor !== String(actor._id) || parsed.expires < Date.now()) fail(409, 'Preview expired or belongs to another administrator');
  return transitionInput(parsed.data);
}
export async function previewTransition(actor, input) {
  await assertIndexReady(); const data = transitionInput(input), p = await plan(data, actor);
  return { transitionId: data.transitionId, input: data, previous: p.previous || null, resultingPlacement: p.target || null, impact: p.impact || p.done?.impact, alreadyCommitted: Boolean(p.done), previewToken: tokenFor(data, actor) };
}
export async function commitTransition(actor, token) {
  await assertIndexReady(); const data = tokenData(token, actor);
  return transaction(async session => {
    const p = await plan(data, actor, session, true);
    if (p.done) return { transition: p.done, alreadyCommitted: true };
    if (p.previous) await Enrollment.updateOne({ _id: p.previous._id }, { $set: { endDate: p.date < p.previous.endDate ? p.date : p.previous.endDate, status: data.type === 'withdrawal' ? 'withdrawn' : data.type === 'completion' ? 'completed' : 'closed', closingTransitionType: data.type, closedBy: actor._id, closedAt: new Date(), closeReason: data.reason } }, { session });
    let enrollment;
    if (p.target) [enrollment] = await Enrollment.create([{ ...p.target, transitionType: data.type, previousEnrollment: p.previous?._id, actor: actor._id, reason: data.reason }], { session });
    // Last-placement projection retained for legacy labels; current access always resolves intervals.
    await Student.updateOne({ _id: data.student }, { ...(p.target ? { $set: { schoolClass: p.target.schoolClass, section: p.target.section, rollNumber: p.target.rollNumber } } : {}), $inc: { enrollmentRevision: 1 } }, { session });
    const [event] = await EnrollmentTransition.create([{ transitionId: data.transitionId, fingerprint: p.fingerprint, student: data.student, type: data.type, effectiveDate: p.date, previousEnrollment: p.previous?._id, enrollment: enrollment?._id, actor: actor._id, reason: data.reason, impact: p.impact }], { session });
    return { transition: event, alreadyCommitted: false };
  });
}
export async function initialEnrollment(student, data, actor, session, initialized = false) {
  if (!actor?._id) fail(400, 'An administrator actor is required');
  const date = data.enrollmentStart ? schoolDate(data.enrollmentStart) : schoolToday();
  if (date > schoolToday()) fail(400, 'Future enrollment is not supported');
  if (date < schoolToday() && !data.enrollmentReason?.trim()) fail(400, 'Backdated admission requires an explicit enrollment reason');
  const cls = await classSection(student.schoolClass, student.section, session);
  const target = await destination({ ...student.toObject(), student: student._id, academicYear: cls.academicYear, effectiveDate: date.toISOString().slice(0, 10) }, session);
  await Section.updateOne({ _id: target.section }, { $inc: { __v: 1 } }, { session });
  await checkEnrollmentSlot(target, session);
  const reason = data.enrollmentReason || 'Initial admission effective today';
  const impact = await impactCheck(student._id, date, target, session);
  const [enrollment] = await Enrollment.create([{ ...target, transitionType: 'admission', actor: actor._id, reason, initialized }], { session });
  student.enrollmentManaged = true; student.enrollmentCutover = date; student.enrollmentRevision = (student.enrollmentRevision || 0) + 1; await student.save({ session });
  await EnrollmentTransition.create([{ transitionId: `admission_${randomUUID()}`, fingerprint: hash(String(enrollment._id)), student: student._id, type: 'admission', effectiveDate: date, enrollment: enrollment._id, actor: actor._id, reason, impact }], { session });
  return enrollment;
}
export function assertPlacementUnchanged(student, data) {
  for (const key of ['schoolClass', 'section', 'rollNumber']) if (data[key] !== undefined && String(data[key]) !== String(student[key])) fail(409, 'Placement and roll changes require the enrollment preview/confirm workflow; profile edits/imports cannot transfer students');
}
const populate = query => query.populate({ path: 'student', select: 'admissionNo user', populate: { path: 'user', select: 'fullname' } }).populate('academicYear', 'name').populate('schoolClass', 'name').populate('section', 'name');
export async function enrollmentList(query = {}) {
  for (const value of Object.values(query)) if (typeof value !== 'string') fail(400, 'Invalid enrollment filter');
  const filter = {};
  for (const key of ['student', 'academicYear', 'schoolClass', 'section']) if (query[key]) filter[key] = objectId(query[key], key);
  if (query.rollNumber) { if (!/^\d+$/.test(query.rollNumber) || Number(query.rollNumber) < 1) fail(400, 'Invalid roll number'); filter.rollNumber = Number(query.rollNumber); }
  if (query.search) {
    const regex = { $regex: query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const users = await User.find({ fullname: regex }).distinct('_id');
    const students = await Student.find({ $or: [{ admissionNo: regex }, { user: { $in: users } }] }).distinct('_id');
    filter.student = { $in: students.filter(s => !query.student || same(s, query.student)) };
  }
  if (query.status === 'current') Object.assign(filter, intervalAt(schoolToday()));
  else if (query.status === 'historical') filter.endDate = { $lte: schoolToday() };
  else if (['withdrawn', 'completed', 'closed', 'active'].includes(query.status)) filter.status = query.status;
  else if (query.status && query.status !== 'all') fail(400, 'Invalid enrollment status');
  const conditions = [filter];
  if (query.from) conditions.push({ endDate: { $gt: schoolDate(query.from) } });
  if (query.to) conditions.push({ startDate: { $lte: schoolDate(query.to) } });
  if (query.from && query.to && query.from > query.to) fail(400, 'Invalid effective date range');
  const limit = Number(query.limit || 20), requested = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const where = { $and: conditions }, total = await Enrollment.countDocuments(where), totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  const records = await populate(Enrollment.find(where).sort({ startDate: -1, _id: 1 }).skip((page - 1) * limit).limit(limit)).lean();
  return { records: records.map(effectiveStatus), pagination: { total, totalPages, page, limit } };
}
const effectiveStatus = row => ({ ...row, effectiveStatus: row.status === 'active' ? row.endDate <= schoolToday() ? 'historical' : row.startDate > schoolToday() ? 'future' : 'current' : row.status });
export async function enrollmentTimeline(studentId, staff = true) {
  const student = await Student.findById(studentId).select('admissionNo user enrollmentManaged enrollmentCutover enrollmentRevision').populate('user', 'fullname');
  if (!student) fail(404, 'Student not found');
  let records = await populate(Enrollment.find({ student: studentId }).sort({ startDate: 1 })).populate('actor', 'fullname').populate('closedBy', 'fullname').lean();
  records = records.map(effectiveStatus);
  if (!staff) records = records.map(({ actor, reason, closedBy, closeReason, ...safe }) => safe);
  const transitions = staff ? await EnrollmentTransition.find({ student: studentId }).populate('actor', 'fullname').sort({ createdAt: 1 }).lean() : undefined;
  return { student, records, ...(staff ? { transitions } : {}), policy: 'Start inclusive / end exclusive. Dates before the established cutover are unresolved, not inferred.' };
}
