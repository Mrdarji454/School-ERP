import asyncHandler from "express-async-handler";
import Attendance from "../../models/Attendance.js";
import Student from "../../models/Student.js";
import { validateAttendance, attendanceScope, updateAttendanceRecord } from "../../services/attendanceService.js";
import { schoolDate } from "../../utils/schoolDate.js";
import { eligibleAssignment } from "../../utils/relationships.js";
import { fail } from "../../utils/errors.js";
import { expectedVersion, auditAction } from '../../services/attendanceVersion.js';
export const createAttendance = asyncHandler(async (req, res) => {
  const data = await validateAttendance(req.body, req.user);
  // Unique index includes inactive records: deletion never permits duplicate history.
  const row = await Attendance.create({ ...data, markedBy: req.user._id });
  res.status(201).json({ success: true, data: row });
});
export const updateAttendance = asyncHandler(async (req, res) => res.json({ success: true, data: await updateAttendanceRecord(req.params.id, req.body, req.user) }));
export const getAllAttendance = asyncHandler(async (req, res) => {
  const scope = { isActive: true, ...await attendanceScope(req.user) };
  if (req.query.teacherAssignment) { await eligibleAssignment(req.query.teacherAssignment, req.user); scope.teacherAssignment = req.query.teacherAssignment; }
  if (req.query.date) scope.attendanceDate = schoolDate(req.query.date);
  if (req.params.id) scope._id = req.params.id;
  const rows = await Attendance.find(scope).select(req.user.role === 'Admin' ? '' : '-audit -markedBy').populate("period").populate({ path: "students.student", select: "user admissionNo rollNumber", populate: { path: "user", select: "fullname" } }).sort({ attendanceDate: -1 });
  if (req.params.id && !rows.length) fail(404, "Attendance not found");
  res.json({ success: true, data: req.params.id ? rows[0] : rows });
});
export const deleteAttendance = asyncHandler(async (req, res) => {
  const existing = await Attendance.findOne({ _id: req.params.id, isLocked: false, isActive: true });
  if (!existing) fail(409, 'Attendance is missing, inactive, or locked');
  expectedVersion(req.body, existing);
  const audit = auditAction(req.user, 'deactivate', req.body.reason);
  const row = await Attendance.findOneAndUpdate({ _id: req.params.id, isLocked: false, isActive: true, __v: req.body.version }, { $set: { isActive: false }, $inc: { __v: 1 }, $push: { audit } }, { new: true });
  if (!row) fail(409, "Attendance is missing, inactive, or locked");
  res.json({ success: true, message: "Attendance deactivated" });
});
export const myAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id, isActive: true });
  if (!student) fail(403, "Active student profile required");
  const rows = await Attendance.find({ isActive: true, "students.student": student._id }, { students: { $elemMatch: { student: student._id } }, attendanceDate: 1, period: 1, teacherAssignment: 1 }).populate("period", 'name periodNumber startTime endTime isBreak').sort({ attendanceDate: -1 });
  const data = rows.map(row => {
    const record = row.toObject();
    record.students = record.students.map(({ remark, ...entry }) => entry);
    return record;
  });
  res.json({ success: true, data });
});
