import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Period from "../models/Period.js";
import AcademicYear from "../models/AcademicYear.js";
import User from "../models/User.js";
import { expectedVersion, auditAction } from './attendanceVersion.js';
import { active, same, eligibleAssignment } from "../utils/relationships.js";
import { schoolDate } from "../utils/schoolDate.js";
import { fail } from "../utils/errors.js";
export function validateEntries(students) {
  if (!Array.isArray(students) || !students.length) fail(400, "Students must be a nonempty array");
  const seen = new Set();
  for (const item of students) {
    if (!item || typeof item.student !== "string" || !/^[a-f\d]{24}$/i.test(item.student)) fail(400, "Invalid student ID");
    if (seen.has(item.student.toLowerCase())) fail(400, "Duplicate student in attendance");
    seen.add(item.student.toLowerCase());
    if (!["Present", "Absent", "Late", "Half Day", "Leave"].includes(item.status)) fail(400, "Invalid attendance status");
    if (item.remark !== undefined && (typeof item.remark !== "string" || item.remark.length > 500)) fail(400, "Invalid attendance remark");
  }
}
export async function validateAttendance(data, user) {
  const assignment = await eligibleAssignment(data.teacherAssignment, user);
  const period = await active(Period, data.period);
  if (period.isBreak) fail(400, "Attendance cannot be recorded for a break");
  const date = schoolDate(data.attendanceDate);
  const year = await active(AcademicYear, assignment.academicYear);
  if (date < year.startDate || date > year.endDate) fail(400, "Attendance date must fall within the assignment academic year");
  validateEntries(data.students);
  const activeUsers = await User.find({ role: 'Student', isActive: true }).distinct('_id');
  const count = await Student.countDocuments({ _id: { $in: data.students.map(s => s.student) }, user: { $in: activeUsers }, schoolClass: assignment.schoolClass, section: assignment.section, isActive: true });
  if (count !== data.students.length) fail(400, "Every student must belong to this active class roster");
  return { teacherAssignment: assignment._id, period: period._id, attendanceDate: date, students: data.students.map(s => ({ student: s.student, status: s.status, remark: s.remark || "" })) };
}
export async function attendanceScope(user) {
  if (user.role === "Admin") return {};
  const teacher = await Teacher.findOne({ user: user._id, isActive: true });
  if (!teacher) fail(403, "Active teacher profile required");
  const assignments = await TeacherAssignment.find({ teacher: teacher._id, isActive: true }).select("_id");
  return { teacherAssignment: { $in: assignments.map(a => a._id) } };
}
export async function updateAttendanceRecord(id, body, user) {
  const row = await Attendance.findOne({ _id: id, isActive: true, ...await attendanceScope(user) });
  if (!row) fail(404, "Attendance not found");
  if (row.isLocked) fail(409, "Attendance is locked");
  expectedVersion(body, row);
  if (body.isLocked !== undefined && user.role !== 'Admin') fail(403, 'Only Admin can change attendance locks');
  const audit = user.role === 'Admin' && body.isLocked === true ? auditAction(user, 'lock', body.reason) : body.reason ? auditAction(user, 'correction', body.reason) : null;
  for (const key of ["teacherAssignment", "period"]) if (body[key] !== undefined && !same(body[key], row[key])) fail(400, "Attendance assignment and period cannot change");
  if (body.attendanceDate && schoolDate(body.attendanceDate).getTime() !== row.attendanceDate.getTime()) fail(400, "Attendance date cannot change");
  const data = await validateAttendance({ teacherAssignment: row.teacherAssignment, period: row.period, attendanceDate: row.attendanceDate.toISOString().slice(0, 10), students: body.students }, user);
  const updated = await Attendance.findOneAndUpdate({ _id: row._id, isActive: true, isLocked: false, __v: body.version }, { $set: { students: data.students, markedBy: user._id, ...(user.role === "Admin" && typeof body.isLocked === "boolean" ? { isLocked: body.isLocked } : {}) }, $inc: { __v: 1 }, ...(audit ? { $push: { audit } } : {}) }, { new: true, runValidators: true });
  if (!updated) fail(409, "Attendance changed or was locked; reload before saving");
  return updated;
}
