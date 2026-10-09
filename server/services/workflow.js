import mongoose from 'mongoose';
import AcademicYear from '../models/AcademicYear.js';
import Attendance from '../models/Attendance.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Period from '../models/Period.js';
import Timetable from '../models/TimeTable.js';
import Notification from '../models/Notification.js';
import { active, eligibleAssignment, same } from '../utils/relationships.js';
import { schoolDate, schoolToday } from '../utils/schoolDate.js';
import { fail } from '../utils/errors.js';
import { timetableScope, populateTimetable } from './timetableService.js';
import { attendanceScope } from './attendanceService.js';
import { expectedVersion, auditAction } from './attendanceVersion.js';
import { summarizeAttendance } from './dashboard/dashboardData.js';

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const statuses = ['Present', 'Absent', 'Late', 'Half Day', 'Leave'];
export function validateQuery(query) {
  for (const [key, value] of Object.entries(query)) if (typeof value !== 'string') fail(400, `Invalid ${key} filter`);
  for (const key of ['academicYear', 'schoolClass', 'section', 'teacher', 'teacherAssignment', 'subject', 'period']) if (query[key] && !mongoose.isObjectIdOrHexString(query[key])) fail(400, `Invalid ${key} identifier`);
  if (query.day && !days.includes(query.day)) fail(400, 'Invalid weekday');
  if (query.status && !['active', 'inactive', 'all'].includes(query.status)) fail(400, 'Invalid record status');
  if (query.studentStatus && !statuses.includes(query.studentStatus)) fail(400, 'Invalid attendance status');
  if (query.locked && !['true', 'false'].includes(query.locked)) fail(400, 'Invalid lock filter');
  for (const key of ['from', 'to', 'date']) if (query[key]) schoolDate(query[key]);
  if (query.from && query.to && query.from > query.to) fail(400, 'End date must follow start date');
}
const assignmentFields = 'academicYear schoolClass section subject teacher isActive';
export const populateAssignment = q => q
  .populate('academicYear', 'name startDate endDate isActive isCurrent')
  .populate('schoolClass', 'name isActive')
  .populate('section', 'name isActive')
  .populate('subject', 'name code isActive')
  .populate({ path: 'teacher', select: 'user isActive', populate: { path: 'user', select: 'fullname isActive' } });
const assignmentPopulation = { path: 'teacherAssignment', select: assignmentFields, populate: [
  { path: 'academicYear', select: 'name startDate endDate isActive' }, { path: 'schoolClass', select: 'name isActive' },
  { path: 'section', select: 'name isActive' }, { path: 'subject', select: 'name code isActive' },
  { path: 'teacher', select: 'user isActive', populate: { path: 'user', select: 'fullname' } },
] };
const periodPopulation = { path: 'period', select: 'name startTime endTime periodNumber isBreak isActive' };
const rosterPopulation = { path: 'students.student', select: 'user admissionNo rollNumber isActive', populate: { path: 'user', select: 'fullname isActive' } };
const eligible = a => Boolean(a.isActive && a.academicYear?.isActive && a.schoolClass?.isActive && a.section?.isActive && a.subject?.isActive && a.teacher?.isActive && a.teacher?.user?.isActive);
async function teacherId(user) {
  const t = await Teacher.findOne({ user: user._id, isActive: true }).select('_id');
  if (!t) fail(403, 'Active teacher profile required');
  return t._id;
}
async function studentProfile(user) {
  const student = await Student.findOne({ user: user._id, isActive: true }).select('schoolClass section');
  if (!student) fail(403, 'Active student profile required');
  return student;
}
export async function workflowOptions(user) {
  let filter = {}, placement = null;
  if (user.role === 'Teacher') filter.teacher = await teacherId(user);
  if (user.role === 'Student') {
    const student = await studentProfile(user);
    placement = await Student.findById(student._id).select('schoolClass section').populate('schoolClass', 'name academicYear isActive').populate('section', 'name isActive').lean();
    const historical = await Attendance.find({ isActive: true, 'students.student': student._id }).distinct('teacherAssignment');
    filter = { $or: [{ schoolClass: student.schoolClass, section: student.section }, { _id: { $in: historical } }] };
  }
  const [assignments, periods] = await Promise.all([
    populateAssignment(TeacherAssignment.find(filter).select(assignmentFields)).lean(),
    Period.find(user.role === 'Student' ? { isActive: true } : {}).select('name periodNumber startTime endTime isBreak isActive').sort({ startTime: 1 }).lean(),
  ]);
  const today = schoolToday().toISOString().slice(0, 10);
  return { assignments: assignments.map(a => ({ ...a, eligible: eligible(a) })), periods, placement, today, day: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(schoolDate(today)), timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' };
}
export async function workflowTimetable(user, query) {
  validateQuery(query);
  let scope;
  if (user.role === 'Admin') {
    const af = {};
    for (const key of ['academicYear', 'schoolClass', 'section', 'teacher']) if (query[key]) af[key] = query[key];
    scope = { ...(query.status === 'all' ? {} : { isActive: query.status !== 'inactive' }), ...(query.day ? { day: query.day } : {}) };
    if (Object.keys(af).length) scope.teacherAssignment = { $in: await TeacherAssignment.find(af).distinct('_id') };
  } else scope = await timetableScope(user, query);
  const records = await populateTimetable(Timetable.find(scope).select('academicYear teacherAssignment day period roomNumber isActive')).lean();
  return { records: user.role === 'Admin' ? records : records.filter(r => r.period?.isActive), days };
}
async function staffAttendanceScope(user, query) {
  const filter = await attendanceScope(user);
  const af = {};
  for (const key of ['academicYear', 'schoolClass', 'section', 'teacher', 'subject']) if (query[key]) af[key] = query[key];
  if (user.role === 'Teacher') {
    const own = await teacherId(user);
    if (query.teacher && !same(query.teacher, own)) fail(403, 'Only your own attendance is available');
    af.teacher = own; af.isActive = true;
  }
  if (query.teacherAssignment) {
    if (user.role === 'Teacher') await eligibleAssignment(query.teacherAssignment, user);
    af._id = query.teacherAssignment;
  }
  if (Object.keys(af).length) filter.teacherAssignment = { $in: await TeacherAssignment.find(af).distinct('_id') };
  return filter;
}
function dates(query) {
  if (query.date) return { attendanceDate: schoolDate(query.date) };
  return query.from || query.to ? { attendanceDate: { ...(query.from ? { $gte: schoolDate(query.from) } : {}), ...(query.to ? { $lte: schoolDate(query.to) } : {}) } } : {};
}
export async function attendanceList(user, query) {
  validateQuery(query);
  const limit = Number(query.limit || 20), requestedPage = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requestedPage) || requestedPage < 1) fail(400, 'Invalid pagination');
  const personal = user.role === 'Student';
  const student = personal ? await studentProfile(user) : null;
  const filter = { ...dates(query), ...(personal ? { isActive: true, 'students.student': student._id } : { ...await staffAttendanceScope(user, query), ...(query.status === 'all' ? {} : { isActive: query.status !== 'inactive' }) }) };
  if (personal && query.subject) filter.teacherAssignment = { $in: await TeacherAssignment.find({ subject: query.subject }).distinct('_id') };
  if (query.period) filter.period = query.period;
  if (!personal && query.locked) filter.isLocked = query.locked === 'true';
  if (query.studentStatus) filter.students = { $elemMatch: { ...(personal ? { student: student._id } : {}), status: query.studentStatus } };
  // Project before populating so Student responses cannot contain classmates or staff audit fields.
  const projection = personal ? { attendanceDate: 1, period: 1, teacherAssignment: 1, students: { $elemMatch: { student: student._id } } } : { attendanceDate: 1, period: 1, teacherAssignment: 1, students: 1, isLocked: 1, isActive: 1, __v: 1 };
  const total = await Attendance.countDocuments(filter), totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requestedPage, totalPages);
  const allForSummary = await Attendance.find(filter, personal ? { students: { $elemMatch: { student: student._id } } } : { students: 1 }).lean();
  const summary = summarizeAttendance(allForSummary);
  let records = await Attendance.find(filter, projection).populate(assignmentPopulation).populate(periodPopulation).sort({ attendanceDate: -1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean();
  records = records.map(r => personal ? { _id: r._id, attendanceDate: r.attendanceDate, period: r.period, subject: r.teacherAssignment?.subject || null, status: r.students[0]?.status } : { ...r, counts: summarizeAttendance([r]), students: undefined });
  return { records, pagination: { page, limit, total, totalPages }, summary, summaryScope: 'All recorded student-period entries in matching sessions; no absence inferred from missing records.' };
}
export async function attendanceDetail(user, id) {
  const row = await Attendance.findOne({ _id: id, ...await attendanceScope(user) }).select(user.role === 'Admin' ? '' : '-audit -markedBy').populate(assignmentPopulation).populate(periodPopulation).populate(rosterPopulation).lean();
  if (!row) fail(404, 'Attendance not found');
  return row;
}
export async function attendanceRoster(user, query) {
  validateQuery(query);
  const assignment = await eligibleAssignment(query.teacherAssignment, user);
  const period = await active(Period, query.period);
  if (period.isBreak) fail(400, 'Attendance cannot be recorded for a break');
  const date = schoolDate(query.date), year = await active(AcademicYear, assignment.academicYear);
  if (date < year.startDate || date > year.endDate) fail(400, 'Date must fall within the academic year');
  const existing = await Attendance.findOne({ teacherAssignment: assignment._id, period: period._id, attendanceDate: date }).select('_id');
  const users = await User.find({ role: 'Student', isActive: true }).distinct('_id');
  const roster = await Student.find({ schoolClass: assignment.schoolClass, section: assignment.section, isActive: true, user: { $in: users } }).select('user admissionNo rollNumber').populate('user', 'fullname').sort({ rollNumber: 1 }).lean();
  return { roster, record: existing ? await attendanceDetail(user, existing._id) : null };
}
export async function setAttendanceLock(user, id, body) {
  const row = await Attendance.findOne({ _id: id, isActive: true });
  if (!row) fail(404, 'Active attendance not found');
  expectedVersion(body, row);
  if (typeof body.isLocked !== 'boolean') fail(400, 'Choose lock or unlock');
  const audit = auditAction(user, body.isLocked ? 'lock' : 'unlock', body.reason);
  const updated = await Attendance.findOneAndUpdate({ _id: id, isActive: true, __v: body.version }, { $set: { isLocked: body.isLocked }, $inc: { __v: 1 }, $push: { audit } }, { new: true, runValidators: true });
  if (!updated) fail(409, 'Attendance changed; reload before changing the lock');
  return updated;
}
export async function publishedNotices() {
  const now = new Date();
  return Notification.find({ isActive: true, publishDate: { $lte: now }, $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] }).select('title message type priority publishDate expiryDate').sort({ publishDate: -1 }).limit(20).lean();
}
