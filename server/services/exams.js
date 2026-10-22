import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import Exam from '../models/Exam.js';
import Schedule from '../models/ExamSchedule.js';
import Publication from '../models/ExamPublication.js';
import Write from '../models/ExamWrite.js';
import ScheduleLock from '../models/ExamScheduleLock.js';
import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import Timetable from '../models/TimeTable.js';
import { intervalAt } from './enrollmentPlacement.js';
import { schoolDate, schoolToday } from '../utils/schoolDate.js';
import { timestamp } from './learningResources.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
import { onlyFields } from './profileValidation.js';
import { examPolicy, markNumber, calculateExam } from './examCalculation.js';
export const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const plain = v => JSON.parse(JSON.stringify(v));
const admin = u => { if (u.role !== 'Admin') fail(403, 'Admin permission required'); };
const oid = v => { if (!mongoose.isObjectIdOrHexString(v)) fail(400, 'Invalid identifier'); return v; };
const why = v => { if (typeof v !== 'string' || !v.trim() || v.length > 500) fail(400, 'A reason of 1–500 characters is required'); return v.trim(); };
const version = (row, v) => { if (!Number.isInteger(v) || v < 0) fail(428, 'Loaded revision required'); if (row.revision !== v) fail(409, 'Record changed. Reload before saving'); };
const matches = (c, candidate) => c.sections.some(s => same(s, candidate.section));
const assigned = (c, u) => u.role === 'Admin' || c.evaluators.some(e => same(e, u._id));
const audit = (e, u, action, reason = '', before, after) => { e.audit.push({ actor: u._id, action, reason, before: before === undefined ? undefined : plain(before), after: after === undefined ? undefined : plain(after) }); e.revision++; };
async function locked(id, session) { const e = await Exam.findOneAndUpdate({ _id: oid(id) }, { $inc: { lockRevision: 1 } }, { new: true, session, timestamps: false }); if (!e) fail(404, 'Exam not found'); return e; }
async function scheduleMutex(session) { await ScheduleLock.updateOne({ _id: 'all-exams' }, { $inc: { revision: 1 } }, { session }); }
async function ensureMutex() { try { await ScheduleLock.updateOne({ _id: 'all-exams' }, { $setOnInsert: { revision: 0 } }, { upsert: true }); } catch (e) { if (e.code !== 11000) throw e; } }
async function teacherUsers(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 20 || new Set(ids.map(String)).size !== ids.length) fail(400, 'Assign 1–20 distinct evaluator accounts');
  ids.forEach(oid);
  const profiles = await Teacher.find({ user: { $in: ids }, isActive: true }).distinct('user');
  if (await User.countDocuments({ _id: { $in: profiles }, role: 'Teacher', isActive: true }) !== ids.length) fail(400, 'Every evaluator must be an active Teacher');
}
async function config(input, old) {
  onlyFields(input, ['name', 'description', 'academicYear', 'sections', 'startDate', 'endDate', 'eligibilityDate', 'entryDeadline', 'components', 'policy', 'version']);
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160 || typeof input.description !== 'string' || input.description.length > 4000) fail(400, 'Name (1–160) and description (maximum 4000) required');
  const year = await AcademicYear.findOne({ _id: oid(input.academicYear), isActive: true }); if (!year) fail(400, 'Active academic year required');
  const startDate = schoolDate(input.startDate), endDate = schoolDate(input.endDate), eligibilityDate = schoolDate(input.eligibilityDate), entryDeadline = timestamp(input.entryDeadline, 'Entry deadline');
  if (startDate > endDate || startDate < year.startDate || endDate > year.endDate || eligibilityDate < year.startDate || eligibilityDate > year.endDate || eligibilityDate > schoolToday()) fail(400, 'Dates must be inside the year, ordered, and eligibility cannot be future');
  if (schoolToday(entryDeadline) < endDate) fail(400, 'Entry deadline cannot precede the exam end date');
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 50 || new Set(input.sections).size !== input.sections.length) fail(400, 'Choose distinct target sections');
  input.sections.forEach(oid);
  const sections = await Section.find({ _id: { $in: input.sections }, isActive: true }).populate('schoolClass');
  if (sections.length !== input.sections.length || sections.some(s => !s.schoolClass?.isActive || !same(s.schoolClass.academicYear, year))) fail(400, 'Target sections must be active and belong to the selected year');
  if (!Array.isArray(input.components) || !input.components.length || input.components.length > 100) fail(400, 'Configure 1–100 components');
  const policy = examPolicy(input.policy, (old?.policy?.version || 0) + 1), components = [];
  for (const c of input.components) {
    onlyFields(c, ['_id', 'name', 'subject', 'sections', 'maximum', 'passMarks', 'evaluators', 'order', 'contributes']);
    const subject = await Subject.findOne({ _id: oid(c.subject), isActive: true });
    if (!subject || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 100 || !Number.isInteger(c.order) || c.order < 0 || c.order > 1000 || typeof c.contributes !== 'boolean') fail(400, 'Invalid component');
    const maximum = markNumber(c.maximum, 'Maximum'), passMarks = markNumber(c.passMarks, 'Pass marks', true);
    if (!maximum || passMarks > maximum) fail(400, 'Maximum must be positive and pass marks cannot exceed it');
    if (!Array.isArray(c.sections) || !c.sections.length || new Set(c.sections).size !== c.sections.length || c.sections.some(s => !sections.some(t => same(t, s) && same(t.schoolClass, subject.schoolClass)))) fail(400, 'Component sections must match the subject class and exam targets');
    await teacherUsers(c.evaluators);
    if (c._id && (!old || !old.components.some(v => same(v._id, c._id)))) fail(400, 'Unknown component identity');
    components.push({ _id: c._id || new mongoose.Types.ObjectId(), name: c.name.trim(), schoolClass: subject.schoolClass, subject: subject._id, sections: c.sections, maximum, passMarks, evaluators: c.evaluators, order: c.order, contributes: c.contributes });
  }
  if (new Set(components.map(c => String(c._id))).size !== components.length || new Set(components.map(c => `${c.subject}:${c.name.toLowerCase()}`)).size !== components.length) fail(400, 'Duplicate component identity/name');
  for (const s of sections) { const covered = components.filter(c => c.sections.some(v => same(v, s))); if (!covered.length || (policy.aggregation === 'sum' && !covered.some(c => c.contributes))) fail(400, 'Every target section needs components and, for totals, a contributing component'); if (covered.reduce((n, c) => n + Math.round(c.maximum * 100), 0) > 100000000) fail(400, 'Component total exceeds supported range'); }
  return { name: input.name.trim(), description: input.description, academicYear: year._id, sections: input.sections, startDate, endDate, eligibilityDate, entryDeadline, components, policy };
}
export async function saveExam(user, id, input, fixtureId) {
  admin(user);
  if (!id) { const data = await config(input); const e = await Exam.create({ ...(fixtureId ? { _id: fixtureId } : {}), ...data, author: user._id, audit: [{ actor: user._id, action: 'created' }] }); return examDetail(user, e._id); }
  await transaction(async session => { const e = await locked(id, session); version(e, input.version); if (e.state !== 'draft' || e.capturedAt || await Schedule.exists({ exam: e._id, active: true }).session(session)) fail(409, 'Configuration is locked after roster capture or scheduling; create a new exam for structural changes'); const data = await config(input, e), before = e.toObject(); Object.assign(e, data); audit(e, user, 'configuration edited', '', before, data); await e.save({ session }); }); return examDetail(user, id);
}
async function candidate(e, studentId, date, session) {
  const enrollment = await Enrollment.findOne({ student: studentId, academicYear: e.academicYear, section: { $in: e.sections }, ...intervalAt(date) }).session(session);
  if (!enrollment) fail(409, 'Established enrollment at the eligibility date is required');
  const s = await Student.findById(studentId).populate('user', 'fullname role').session(session), section = await Section.findById(enrollment.section).populate('schoolClass', 'name').session(session);
  if (!s?.user || s.user.role !== 'Student') fail(409, 'Student identity cannot be resolved');
  return { student: s._id, user: s.user._id, name: s.user.fullname, admissionNo: s.admissionNo, academicYear: e.academicYear, schoolClass: enrollment.schoolClass, section: enrollment.section, className: section.schoolClass.name, sectionName: section.name, rollNumber: enrollment.rollNumber, enrollment: enrollment._id, eligibilityDate: date, capturedAt: new Date() };
}
async function capture(e, session) {
  const ids = await Enrollment.find({ academicYear: e.academicYear, section: { $in: e.sections }, ...intervalAt(e.eligibilityDate) }).session(session).distinct('student');
  for (const id of ids) e.candidates.push(await candidate(e, id, e.eligibilityDate, session));
  const initializedLater = await Enrollment.find({ initialized: true, startDate: { $gt: e.eligibilityDate } }).session(session).distinct('student');
  const unresolved = await Student.find({ section: { $in: e.sections }, _id: { $nin: ids }, $or: [{ enrollmentManaged: { $ne: true } }, { _id: { $in: initializedLater } }] }).populate('user', 'fullname').session(session);
  e.unresolved = unresolved.map(s => ({ student: String(s._id), name: s.user?.fullname, admissionNo: s.admissionNo, resolution: null, reason: 'No established enrollment at the selected eligibility date' })); e.capturedAt = new Date();
}
function componentEntries(e, c) { return e.candidates.filter(r => r.active && matches(c, r)).map(r => ({ candidate: r, entry: e.entries.find(v => same(v.candidate, r._id) && same(v.component, c._id)) })); }
function incomplete(e, c) { return componentEntries(e, c).filter(({ entry }) => !entry || entry.state === 'Not entered' || (entry.state === 'Exempt' && e.policy.exempt !== 'exclude') || (entry.state === 'Scored' && (entry.score == null || entry.score < 0 || entry.score > c.maximum))); }
function syncState(e) { e.state = e.components.every(c => c.state === 'approved') ? 'approved' : e.components.every(c => ['submitted', 'approved'].includes(c.state)) ? 'submitted-for-review' : 'open-for-entry'; }
export async function examAction(user, id, input) {
  admin(user); onlyFields(input, ['action', 'version', 'reason', 'component', 'components', 'student', 'candidate', 'eligibilityDate', 'evaluators', 'entryDeadline']);
  await ensureMutex();
  await transaction(async session => {
    await scheduleMutex(session); const e = await locked(id, session); version(e, input.version);
    if (e.state === 'archived') fail(409, 'Archived exam is read-only');
    const before = { state: e.state, components: e.components, candidates: e.candidates, unresolved: e.unresolved, entryDeadline: e.entryDeadline };
    const savedBefore = plain(before), action = input.action;
    if (action === 'capture') { if (e.state !== 'draft' || e.capturedAt) fail(409, 'Roster already captured or exam opened'); await capture(e, session); }
    else if (action === 'resolve-legacy') {
      why(input.reason); const unresolved = e.unresolved.find(r => r.student === String(input.student) && !r.resolution); if (!unresolved) fail(404, 'Unresolved candidate not found');
      // Resolution is explicit exclusion. To include, establish truthful enrollment then use add-candidate.
      unresolved.resolution = 'excluded'; unresolved.resolvedReason = input.reason; unresolved.actor = String(user._id); unresolved.at = new Date(); e.markModified('unresolved');
    } else if (action === 'add-candidate' || action === 'remove-candidate') {
      why(input.reason); if (!e.capturedAt || !['draft', 'open-for-entry'].includes(e.state) || e.components.some(c => !['entry', 'returned'].includes(c.state))) fail(409, 'Candidate changes require an editable, unsubmitted roster');
      if (action === 'add-candidate') { oid(input.student); if (e.candidates.some(c => same(c.student, input.student))) fail(409, 'Candidate already recorded (including removed history)'); const date = schoolDate(input.eligibilityDate); if (date > schoolToday()) fail(400, 'Eligibility cannot be future'); e.candidates.push(await candidate(e, input.student, date, session)); const u = e.unresolved.find(r => r.student === input.student); if (u) { u.resolution = 'established-enrollment'; u.resolvedReason = input.reason; e.markModified('unresolved'); } }
      else { const c = e.candidates.id(oid(input.candidate)); if (!c?.active) fail(404, 'Active candidate not found'); if (e.entries.some(v => same(v.candidate, c._id) && v.state !== 'Not entered')) fail(409, 'Candidate has recorded marks/status and cannot be removed'); c.active = false; }
    } else if (action === 'open') {
      if (e.state !== 'draft' || !e.capturedAt || !e.candidates.some(c => c.active) || e.unresolved.some(r => !r.resolution)) fail(409, 'Capture candidates and explicitly resolve every unknown legacy candidate first'); e.state = 'open-for-entry';
    } else if (action === 'delegate') {
      why(input.reason); if (['approved', 'published'].includes(e.state)) fail(409, 'Begin a reviewed correction before changing evaluators'); const c = e.components.id(oid(input.component)); if (!c) fail(404, 'Component not found'); await teacherUsers(input.evaluators); c.evaluators = input.evaluators;
    } else if (action === 'extend-deadline') { why(input.reason); const date = timestamp(input.entryDeadline, 'Entry deadline'); if (date <= e.entryDeadline) fail(400, 'Deadline can only be extended'); e.entryDeadline = date; }
    else if (action === 'return') { why(input.reason); const c = e.components.id(oid(input.component)); if (!c || !['submitted', 'approved'].includes(c.state) || e.state === 'published') fail(409, 'Only reviewed/submitted work can be returned; published work requires a correction cycle'); c.state = 'returned'; c.returnReason = input.reason; syncState(e); }
    else if (action === 'approve') { if (e.state !== 'submitted-for-review' || e.components.some(c => incomplete(e, c).length)) fail(409, 'Every required entry and component submission must be resolved'); e.components.forEach(c => { c.state = 'approved'; }); e.state = 'approved'; }
    else if (action === 'publish') {
      if (e.state !== 'approved' || e.components.some(c => c.state !== 'approved' || incomplete(e, c).length)) fail(409, 'Only complete approved marks can be published');
      if (e.publicationVersion) why(e.correctionReason);
      const subjects = await Subject.find({ _id: { $in: e.components.map(c => c.subject) } }).select('name').session(session);
      const components = e.components.map(c => ({ ...plain(c), subjectName: subjects.find(s => same(s, c.subject))?.name || 'Subject' })).sort((a, b) => a.order - b.order);
      const results = e.candidates.filter(c => c.active).map(c => ({ ...plain(c), ...calculateExam(components.filter(v => matches(v, c)), e.entries.filter(v => same(v.candidate, c._id)), e.policy) }));
      const year = await AcademicYear.findById(e.academicYear).select('name').session(session);
      e.publicationVersion++; await Publication.create([{ exam: e._id, version: e.publicationVersion, actor: user._id, reason: e.correctionReason || 'Initial approved publication', payload: { name: e.name, academicYear: String(e.academicYear), academicYearName: year.name, components, policy: plain(e.policy), results, examRevision: e.revision, eligibilityDate: e.eligibilityDate, timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' } }], { session }); e.state = 'published';
    } else if (action === 'correct') {
      why(input.reason); if (e.state !== 'published' || !Array.isArray(input.components) || !input.components.length || new Set(input.components).size !== input.components.length || input.components.some(id => !e.components.id(id))) fail(409, 'Select exact components of a published exam for correction'); e.correctionReason = input.reason; e.components.forEach(c => { if (input.components.some(id => same(id, c._id))) { c.state = 'returned'; c.returnReason = input.reason; } }); syncState(e);
    } else if (action === 'archive') { why(input.reason); e.state = 'archived'; await Schedule.updateMany({ exam: e._id }, { $set: { active: false } }, { session }); }
    else fail(400, 'Unsupported exam action');
    audit(e, user, action, input.reason || '', savedBefore, { state: e.state, components: e.components, candidates: e.candidates, unresolved: e.unresolved, entryDeadline: e.entryDeadline, publicationVersion: e.publicationVersion }); await e.save({ session });
  }); return examDetail(user, id);
}
export async function saveMarks(user, id, componentId, input, key) {
  if (user.role !== 'Teacher') fail(403, 'Only explicitly assigned Teachers enter marks');
  onlyFields(input, ['version', 'action', 'entries']); if (!['save', 'submit'].includes(input.action) || !Array.isArray(input.entries) || input.entries.length > 500 || new Set(input.entries.map(r => r.candidate)).size !== input.entries.length) fail(400, 'Provide distinct candidate entries and save/submit action');
  if (typeof key !== 'string' || !/^[A-Za-z0-9:_-]{8,128}$/.test(key)) fail(400, 'Stable Idempotency-Key required');
  const fingerprint = createHash('sha256').update(JSON.stringify({ id, componentId, input })).digest('hex');
  const match = w => { if (w.fingerprint !== fingerprint) fail(409, 'Retry key belongs to different marks'); return w.result; };
  try { return await transaction(async session => {
    const prior = await Write.findOne({ actor: user._id, key }).session(session); if (prior) return match(prior);
    const e = await locked(id, session), c = e.components.id(oid(componentId));
    if (!c || !assigned(c, user)) fail(404, 'Assigned component not found'); version(e, input.version);
    if (e.state !== 'open-for-entry' || !['entry', 'returned'].includes(c.state)) fail(409, 'Marks are locked; Admin must return this component for correction');
    if (e.entryDeadline < new Date()) fail(409, 'Entry deadline passed; Admin must explicitly extend it');
    const before = e.entries.filter(v => same(v.component, c._id)).map(plain);
    for (const r of input.entries) {
      onlyFields(r, ['candidate', 'state', 'score']); const candidate = e.candidates.id(oid(r.candidate)); if (!candidate?.active || !matches(c, candidate)) fail(400, 'Candidate does not belong to this component');
      if (!['Not entered', 'Scored', 'Absent', 'Exempt'].includes(r.state) || (r.state === 'Exempt' && e.policy.exempt !== 'exclude')) fail(400, 'Entry state is not permitted');
      const score = r.state === 'Scored' ? markNumber(r.score, 'Score') : null;
      if (score > c.maximum || (r.state !== 'Scored' && r.score != null)) fail(400, 'Score must fit the component; non-scored states cannot carry a score');
      const old = e.entries.find(v => same(v.candidate, candidate._id) && same(v.component, c._id)), value = { candidate: candidate._id, component: c._id, state: r.state, score, actor: user._id, at: new Date() };
      if (old) Object.assign(old, value); else e.entries.push(value);
    }
    if (input.action === 'submit') { if (incomplete(e, c).length) fail(409, 'Resolve every required candidate entry before submission'); c.state = 'submitted'; c.returnReason = ''; syncState(e); }
    audit(e, user, `marks ${input.action}`, '', { component: String(c._id), entries: before }, { component: String(c._id), entries: e.entries.filter(v => same(v.component, c._id)), state: c.state }); await e.save({ session });
    const result = { revision: e.revision, state: c.state }; await Write.create([{ actor: user._id, key, fingerprint, result }], { session }); return result;
  }); } catch (error) { if (error.code === 11000) { const w = await Write.findOne({ actor: user._id, key }); if (w) return match(w); } throw error; }
}
export async function saveSchedule(user, id, input, scheduleId) {
  admin(user); onlyFields(input, ['version', 'component', 'sections', 'date', 'startTime', 'endTime', 'room', 'invigilator', 'reason', 'active']); await ensureMutex();
  await transaction(async session => {
    await scheduleMutex(session); const e = await locked(id, session); version(e, input.version);
    if (!['draft', 'open-for-entry'].includes(e.state)) fail(409, 'Scheduling is locked in review/published states'); if (e.state !== 'draft') why(input.reason);
    const c = e.components.id(oid(input.component)), date = schoolDate(input.date);
    if (!c || !Array.isArray(input.sections) || !input.sections.length || new Set(input.sections).size !== input.sections.length || input.sections.some(s => !c.sections.some(v => same(s, v)))) fail(400, 'Choose sections belonging to this component');
    if (date < e.startDate || date > e.endDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime) || input.startTime >= input.endTime) fail(400, 'Use an exam date and ordered HH:mm times');
    if (typeof input.room !== 'string' || input.room.length > 100 || typeof input.active !== 'boolean') fail(400, 'Invalid room or schedule state');
    if (input.invigilator) await teacherUsers([input.invigilator]);
    const roomKey = input.room.trim().toLowerCase(), except = scheduleId ? { _id: { $ne: oid(scheduleId) } } : {};
    if (input.active) {
      if (await Schedule.exists({ exam: e._id, component: c._id, sections: { $in: input.sections }, active: true, ...except }).session(session)) fail(409, 'A sitting already exists for this component/section');
      const others = await Schedule.find({ active: true, date, startTime: { $lt: input.endTime }, endTime: { $gt: input.startTime }, ...except }).session(session);
      if (others.some(s => s.sections.some(v => input.sections.some(t => same(v, t))) || (roomKey && roomKey === s.roomKey) || (input.invigilator && same(s.invigilator, input.invigilator)))) fail(409, 'Section, room or invigilator overlaps another exam schedule');
    }
    let row = scheduleId ? await Schedule.findOne({ _id: scheduleId, exam: e._id }).session(session) : new Schedule({ exam: e._id }); if (!row) fail(404, 'Schedule not found');
    const before = row.toObject(); Object.assign(row, { component: c._id, sections: input.sections, date, startTime: input.startTime, endTime: input.endTime, room: input.room.trim(), roomKey, invigilator: input.invigilator || null, active: input.active, actor: user._id }); row.revision++; await row.save({ session }); audit(e, user, 'schedule saved', input.reason || '', before, row.toObject()); await e.save({ session });
  }); return examDetail(user, id);
}
async function timetableClashes(e, schedules) {
  const bookings = await Timetable.find({ academicYear: e.academicYear, isActive: true }).populate({ path: 'teacherAssignment', populate: { path: 'teacher', select: 'user' } }).populate('period').lean();
  return schedules.filter(s => s.active).flatMap(s => { const day = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(s.date); return bookings.filter(b => b.day === day && b.teacherAssignment?.isActive && b.period?.isActive && !b.period.isBreak && b.period.startTime < s.endTime && s.startTime < b.period.endTime && (s.sections.some(v => same(v, b.teacherAssignment.section)) || (s.roomKey && s.roomKey === b.roomNumber?.trim().toLowerCase()) || (s.invigilator && same(s.invigilator, b.teacherAssignment.teacher?.user)))).map(b => ({ schedule: s._id, date: s.date, room: s.room, lesson: b._id, startTime: b.period.startTime, endTime: b.period.endTime, message: 'Normal timetable clash remains unresolved; lessons and attendance have not been changed' })); });
}
async function readable(user, id) { const e = await Exam.findById(oid(id)); if (!e) fail(404, 'Exam not found'); if (user.role === 'Teacher' && !e.components.some(c => assigned(c, user))) fail(404, 'Exam not assigned'); if (user.role === 'Student' && (e.state === 'draft' || !e.candidates.some(c => c.active && same(c.user, user._id)))) fail(404, 'Exam schedule not available'); return e; }
export async function examDetail(user, id) {
  const e = await readable(user, id), components = e.components.filter(c => user.role !== 'Teacher' || assigned(c, user));
  const candidates = e.candidates.filter(c => user.role === 'Student' ? same(c.user, user._id) : components.some(v => matches(v, c)));
  const sections = await Section.find({ _id: { $in: e.sections } }).select('name schoolClass').populate('schoolClass', 'name').lean();
  const subjects = await Subject.find({ _id: { $in: components.map(c => c.subject) } }).select('name').lean(), evaluators = user.role === 'Student' ? [] : await User.find({ _id: { $in: components.flatMap(c => c.evaluators) } }).select('fullname').lean();
  const schedules = await Schedule.find({ exam: e._id, ...(user.role === 'Admin' ? {} : { active: true, component: { $in: components.map(c => c._id) }, ...(user.role === 'Student' ? { sections: { $in: candidates.map(c => c.section) } } : {}) }) }).sort({ date: 1, startTime: 1 }).lean();
  const invigilators = await User.find({ _id: { $in: schedules.map(s => s.invigilator).filter(Boolean) } }).select('fullname').lean();
  for (const s of schedules) s.invigilatorName = invigilators.find(u => same(u, s.invigilator))?.fullname || '';
  const metadata = { _id: e._id, name: e.name, description: e.description, academicYear: e.academicYear, startDate: e.startDate, endDate: e.endDate, entryDeadline: e.entryDeadline, eligibilityDate: e.eligibilityDate, state: e.state, timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata', sections, schedules };
  if (user.role === 'Student') return { ...metadata, components: components.filter(c => candidates.some(r => matches(c, r))).map(c => ({ _id: c._id, name: c.name, subjectName: subjects.find(s => same(s, c.subject))?.name })) };
  return { ...metadata, revision: e.revision, capturedAt: e.capturedAt, publicationVersion: e.publicationVersion, policy: e.policy, candidates, components: components.map(c => ({ ...c.toObject(), subjectName: subjects.find(s => same(s, c.subject))?.name, evaluators: c.evaluators.map(id => ({ _id: id, fullname: evaluators.find(u => same(u, id))?.fullname })), required: componentEntries(e, c).length, missing: incomplete(e, c).length })), entries: e.entries.filter(v => components.some(c => same(c._id, v.component)) && candidates.some(c => same(c._id, v.candidate))), ...(user.role === 'Admin' ? { unresolved: e.unresolved, audit: await Exam.findById(e._id).select('audit').populate('audit.actor', 'fullname').lean().then(r => r.audit), timetableClashes: await timetableClashes(e, schedules) } : {}) };
}
export async function listExams(user, query = {}) {
  for (const v of Object.values(query)) if (typeof v !== 'string') fail(400, 'Invalid exam filter');
  const filter = user.role === 'Teacher' ? { 'components.evaluators': user._id } : user.role === 'Student' ? { state: { $ne: 'draft' }, candidates: { $elemMatch: { user: user._id, active: true } } } : {};
  const yearIds = await Exam.find(filter).distinct('academicYear');
  const years = await AcademicYear.find({ _id: { $in: yearIds } }).select('name').sort({ startDate: -1 }).lean();
  if (query.academicYear) filter.academicYear = oid(query.academicYear);
  if (query.section) filter.sections = oid(query.section);
  if (query.state) { if (!['draft', 'open-for-entry', 'submitted-for-review', 'approved', 'published', 'archived'].includes(query.state)) fail(400, 'Invalid exam state'); filter.$and = [{ state: query.state }]; }
  if (query.search) filter.name = { $regex: query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const all = await Exam.find(filter).populate('academicYear', 'name').sort({ startDate: -1, _id: 1 });
  const limit = Number(query.limit || 12), requested = Number(query.page || 1); if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const total = all.length, totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  const summary = { upcoming: all.filter(e => e.endDate >= schoolToday() && !['draft', 'archived'].includes(e.state)).length, reviews: user.role === 'Admin' ? all.reduce((n, e) => n + e.components.filter(c => c.state === 'submitted').length, 0) : 0, ready: user.role === 'Admin' ? all.filter(e => e.state === 'approved').length : 0, tasks: user.role === 'Teacher' ? all.reduce((n, e) => n + (e.state === 'open-for-entry' ? e.components.filter(c => assigned(c, user) && ['entry', 'returned'].includes(c.state)).length : 0), 0) : 0, returned: user.role === 'Teacher' ? all.reduce((n, e) => n + e.components.filter(c => assigned(c, user) && c.state === 'returned').length, 0) : 0 };
  const futureSchedules = await Schedule.find({ exam: { $in: all.map(e => e._id) }, active: true, date: { $gte: schoolToday() } }).sort({ date: 1, startTime: 1 }).lean();
  const eligibleSchedules = futureSchedules.filter(s => { const exam = all.find(e => same(e, s.exam)); return user.role === 'Admin' || (user.role === 'Teacher' ? exam.components.some(c => same(c._id, s.component) && assigned(c, user)) : exam.candidates.some(c => c.active && same(c.user, user._id) && s.sections.some(v => same(v, c.section)))); });
  const schedulePreview = eligibleSchedules.slice(0, 3).map(s => ({ _id: s._id, exam: s.exam, name: all.find(e => same(e, s.exam)).name, date: s.date, startTime: s.startTime, endTime: s.endTime, room: s.room }));
  const entryPreview = user.role === 'Teacher' ? all.filter(e => e.state === 'open-for-entry').flatMap(e => e.components.filter(c => assigned(c, user) && ['entry', 'returned'].includes(c.state)).map(c => ({ _id: c._id, name: `${e.name} / ${c.name}`, deadline: e.entryDeadline }))).sort((a, b) => a.deadline - b.deadline).slice(0, 3) : [];
  return { records: all.slice((page - 1) * limit, page * limit).map(e => ({ _id: e._id, name: e.name, academicYear: e.academicYear, state: e.state, startDate: e.startDate, endDate: e.endDate, entryDeadline: e.entryDeadline })), years, summary, schedulePreview, scheduleTotal: eligibleSchedules.length, entryPreview, pagination: { total, totalPages, page, limit }, timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' };
}
export async function resultList(user, query = {}) {
  if (!['Admin', 'Student'].includes(user.role)) fail(403, 'Published result access is limited to Admin or the owning Student');
  const filter = user.role === 'Student' ? { 'payload.results.user': String(user._id) } : {};
  if (query.academicYear) filter['payload.academicYear'] = String(oid(query.academicYear));
  const publications = await Publication.find(filter).sort({ version: -1, createdAt: -1 }).lean();
  const latest = [...new Map(publications.slice().reverse().map(p => [String(p.exam), p])).values()].sort((a, b) => b.createdAt - a.createdAt);
  const exams = user.role === 'Student' ? await Exam.find({ _id: { $in: latest.map(p => p.exam) } }).select('candidates').lean() : [];
  return { records: latest.map(p => ({ _id: p.exam, name: p.payload.name, academicYear: p.payload.academicYear, academicYearName: p.payload.academicYearName, version: p.version, createdAt: p.createdAt, unread: user.role === 'Student' && (exams.find(e => same(e, p.exam))?.candidates.find(c => same(c.user, user._id))?.seenVersion || 0) < p.version, versions: publications.filter(v => same(v.exam, p.exam)).map(v => v.version) })), years: [...new Map(publications.map(p => [p.payload.academicYear, { _id: p.payload.academicYear, name: p.payload.academicYearName }])).values()] };
}
export async function publishedResult(user, id, v, candidateId) {
  if (!['Admin', 'Student'].includes(user.role)) fail(403, 'Only Admin or the owning Student can read published results');
  const filter = { exam: oid(id), ...(v ? { version: Number(v) } : {}), ...(user.role === 'Student' ? { 'payload.results.user': String(user._id) } : {}) };
  const p = await Publication.findOne(filter).sort({ version: -1 }).populate('actor', 'fullname').lean(); if (!p) fail(404, 'Published result not found');
  const results = p.payload.results.filter(r => (user.role !== 'Student' || same(r.user, user._id)) && (!candidateId || same(r._id, candidateId)));
  if (!results.length) fail(404, 'Owned published result not found');
  const components = p.payload.components.filter(c => results.some(r => r.marks.some(m => same(m.component, c._id)))).map(c => ({ _id: c._id, name: c.name, subjectName: c.subjectName, maximum: c.maximum, passMarks: c.passMarks, order: c.order, contributes: c.contributes }));
  return { exam: p.exam, version: p.version, publishedAt: p.createdAt, publishedBy: p.actor?.fullname, reason: p.reason, ...p.payload, components, results };
}
export async function resultSeen(user, id, v) { if (user.role !== 'Student') fail(403, 'Student permission required'); const p = await publishedResult(user, id, v); await Exam.updateOne({ _id: id }, { $max: { 'candidates.$[c].seenVersion': p.version } }, { arrayFilters: [{ 'c.user': user._id }], timestamps: false }); return { seen: true }; }
export async function candidateOptions(user, id, date) { admin(user); const e = await readable(user, id), at = schoolDate(date); if (at > schoolToday()) fail(400, 'Eligibility cannot be future'); const ids = await Enrollment.find({ academicYear: e.academicYear, section: { $in: e.sections }, ...intervalAt(at) }).distinct('student'); return Student.find({ _id: { $in: ids, $nin: e.candidates.map(c => c.student) } }).select('admissionNo user').populate('user', 'fullname').lean(); }
