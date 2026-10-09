import asyncHandler from "express-async-handler";
import Timetable from "../../models/TimeTable.js";
import AcademicYear from "../../models/AcademicYear.js";
import { saveTimetable, timetableScope, populateTimetable } from "../../services/timetableService.js";
import { transaction } from "../../utils/transaction.js";
import { fail } from "../../utils/errors.js";
export const createTimetable = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await saveTimetable(null, req.body, req.user) }));
export const updateTimetable = asyncHandler(async (req, res) => res.json({ success: true, data: await saveTimetable(req.params.id, req.body, req.user) }));
export const getAllTimetables = asyncHandler(async (req, res) => {
  const filters = { ...req.query, ...(req.params.classId ? { schoolClass: req.params.classId } : {}), ...(req.params.teacherId ? { teacher: req.params.teacherId } : {}) };
  const scope = await timetableScope(req.user, filters);
  if (req.params.id) scope._id = req.params.id;
  const rows = await populateTimetable(Timetable.find(scope).select(req.user.role === 'Admin' ? '' : 'academicYear teacherAssignment day period roomNumber isActive')).sort({ day: 1 });
  const data = rows.filter(row => row.period?.isActive);
  if (req.params.id && !data.length) fail(404, "Timetable not found");
  res.json({ success: true, data: req.params.id ? data[0] : data });
});
export const deleteTimetable = asyncHandler(async (req, res) => {
  await transaction(async session => {
    const row = await Timetable.findById(req.params.id).session(session);
    if (!row) fail(404, "Timetable not found");
    await AcademicYear.updateOne({ _id: row.academicYear }, { $inc: { __v: 1 } }, { session });
    row.isActive = false; await row.save({ session });
  });
  res.json({ success: true, message: "Timetable deactivated" });
});
