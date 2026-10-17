import Student from '../models/Student.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import AcademicYear from '../models/AcademicYear.js';
import Enrollment from '../models/Enrollment.js';
import { schoolDate, schoolToday } from '../utils/schoolDate.js';
import { initialEnrollment, legacyRollIndexes, impactCheck, checkEnrollmentSlot, nextDate } from './enrollments.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
export async function initializationPlan(cutover) {
  const date = schoolDate(cutover);
  if (date > schoolToday()) fail(400, 'Cutover must not be in the future');
  const students = await Student.find().select('admissionNo schoolClass section rollNumber enrollmentManaged enrollmentCutover').lean(), rows = [];
  for (const s of students) {
    if (s.enrollmentManaged) { rows.push({ student: s._id, admissionNo: s.admissionNo, action: 'skip', reason: 'Already initialized; preserved' }); continue; }
    const cls = await SchoolClass.findById(s.schoolClass), sec = await Section.findById(s.section), year = cls && await AcademicYear.findById(cls.academicYear);
    let reason = '';
    if (!cls?.isActive || !sec?.isActive || !year?.isActive || String(sec.schoolClass) !== String(cls._id)) reason = 'Missing/inactive or inconsistent academic relationship';
    else if (!Number.isInteger(s.rollNumber) || s.rollNumber < 1) reason = 'Invalid roll number';
    else if (date < year.startDate || date > year.endDate) reason = 'Cutover outside the legacy placement academic year; resolve explicitly';
    else if (students.some(o => String(o._id) !== String(s._id) && !o.enrollmentManaged && String(o.schoolClass) === String(s.schoolClass) && String(o.section) === String(s.section) && o.rollNumber === s.rollNumber)) reason = 'Duplicate unresolved legacy scoped roll';
    if (!reason) {
      try {
        const target = { student: s._id, academicYear: year._id, schoolClass: cls._id, section: sec._id, rollNumber: s.rollNumber, startDate: date, endDate: nextDate(year.endDate) };
        await checkEnrollmentSlot(target, null); await impactCheck(s._id, date, target);
      } catch (error) { if (!error.status) throw error; reason = error.message; }
    }
    rows.push({ student: s._id, admissionNo: s.admissionNo, action: reason ? 'blocked' : 'initialize', reason: reason || 'Snapshot the known placement from the explicit cutover only', startDate: cutover, academicYear: year?._id });
  }
  const overlaps = [], enrollments = await Enrollment.find().lean();
  for (let i = 0; i < enrollments.length; i++) for (const b of enrollments.slice(i + 1)) {
    const a = enrollments[i];
    if (a.startDate < b.endDate && b.startDate < a.endDate && (String(a.student) === String(b.student) || (String(a.academicYear) === String(b.academicYear) && String(a.schoolClass) === String(b.schoolClass) && String(a.section) === String(b.section) && a.rollNumber === b.rollNumber))) overlaps.push({ first: a._id, second: b._id });
  }
  return { cutover, interval: '[startDate,endDate)', legacyRollIndexes: (await legacyRollIndexes()).map(i => i.name), rows, overlaps, initialize: rows.filter(r => r.action === 'initialize').length, blocked: rows.filter(r => r.action === 'blocked').length, skipped: rows.filter(r => r.action === 'skip').length };
}
export async function initializeEnrollments(actor, cutover) {
  const plan = await initializationPlan(cutover), outcomes = [];
  if (plan.overlaps.length) fail(409, 'Existing enrollment overlaps must be resolved before initialization');
  for (const row of plan.rows) {
    if (row.action !== 'initialize') { outcomes.push(row); continue; }
    try {
      await transaction(async session => {
        const student = await Student.findById(row.student).session(session);
        if (student.enrollmentManaged) return;
        await Student.updateOne({ _id: student._id }, { $inc: { __v: 1 } }, { session });
        await initialEnrollment(student, { enrollmentStart: cutover, enrollmentReason: `Explicit legacy cutover ${cutover}; earlier enrollment unknown` }, actor, session, true);
      });
      outcomes.push({ ...row, action: 'initialized' });
    } catch (e) { outcomes.push({ ...row, action: 'failed', reason: e.status ? e.message : 'Initialization rolled back for this student' }); }
  }
  return { cutover, outcomes };
}
