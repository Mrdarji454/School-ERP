import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { schoolToday } from '../utils/schoolDate.js';
export const intervalAt = date => ({ startDate: { $lte: date }, endDate: { $gt: date } });
export async function placementAt(student, date = schoolToday(), session = null, legacyCurrent = false) {
  if (!student) return null;
  const row = await Enrollment.findOne({ student: student._id, ...intervalAt(date) }).session(session).lean();
  if (row) return row;
  // Explicit compatibility only for today's access, never historical roster evidence.
  if (!student.enrollmentManaged && legacyCurrent && date.getTime() === schoolToday().getTime() && student.schoolClass && student.section) return { schoolClass: student.schoolClass, section: student.section, rollNumber: student.rollNumber, legacyUnresolved: true };
  return null;
}
export async function currentStudentIds(filter = {}, date = schoolToday()) {
  const managed = await Enrollment.find({ ...filter, ...intervalAt(date) }).distinct('student');
  const legacy = await Student.find({ enrollmentManaged: { $ne: true }, ...Object.fromEntries(['schoolClass', 'section'].filter(k => filter[k]).map(k => [k, filter[k]])) }).distinct('_id');
  return [...managed, ...legacy];
}
export async function datedRoster(assignment, date, session = null) {
  const placements = await Enrollment.find({ academicYear: assignment.academicYear, schoolClass: assignment.schoolClass, section: assignment.section, ...intervalAt(date) }).session(session).lean();
  const active = date >= schoolToday() ? { isActive: true } : {};
  const accounts = await User.find({ ...active, role: 'Student' }).session(session).distinct('_id');
  const students = await Student.find({ _id: { $in: placements.map(e => e.student) }, ...active, user: { $in: accounts } }).select('user admissionNo').populate('user', 'fullname').session(session).lean();
  return students.map(s => ({ ...s, rollNumber: placements.find(e => String(e.student) === String(s._id)).rollNumber })).sort((a, b) => a.rollNumber - b.rollNumber);
}
