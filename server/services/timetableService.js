import Timetable from "../models/TimeTable.js";
import AcademicYear from "../models/AcademicYear.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Period from "../models/Period.js";
import { transaction } from "../utils/transaction.js";
import { active, same, eligibleAssignment } from "../utils/relationships.js";
import { fail } from "../utils/errors.js";
import { placementAt } from './enrollmentPlacement.js';
export const overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime;
export function bookingConflict(candidate, existing) {
  if (!overlaps(candidate.period, existing.period)) return false;
  const a = candidate.teacherAssignment, b = existing.teacherAssignment;
  return same(a.teacher, b.teacher) || (same(a.schoolClass, b.schoolClass) && same(a.section, b.section)) || Boolean(candidate.roomNumber && candidate.roomNumber.trim().toLowerCase() === existing.roomNumber?.trim().toLowerCase());
}
export async function saveTimetable(id, body, user) {
  return transaction(async session => {
    let row = id ? await Timetable.findById(id).session(session) : new Timetable();
    if (!row) fail(404, "Timetable not found");
    const data = { ...row.toObject(), ...Object.fromEntries(["academicYear", "teacherAssignment", "day", "period", "roomNumber"].filter(k => body[k] !== undefined).map(k => [k, body[k]])) };
    if (data.roomNumber !== undefined && (typeof data.roomNumber !== "string" || data.roomNumber.length > 100)) fail(400, "Invalid room number");
    if (id && !same(data.academicYear, row.academicYear)) fail(400, "A timetable cannot move to another academic year");
    // All scheduling writes for a year contend on this document, including different assignments.
    const year = await AcademicYear.findOneAndUpdate({ _id: data.academicYear, isActive: true }, { $inc: { __v: 1 } }, { session, new: true });
    if (!year) fail(400, "Academic year is missing or inactive");
    const assignment = await eligibleAssignment(data.teacherAssignment, user, session);
    if (!same(assignment.academicYear, year)) fail(400, "Assignment and timetable academic years differ");
    const period = await active(Period, data.period, session);
    await Period.updateOne({ _id: period._id }, { $inc: { __v: 1 } }, { session });
    if (period.isBreak) fail(400, "Cannot schedule a lesson during a break");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(period.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.endTime) || period.startTime >= period.endTime) fail(400, "Invalid period time range");
    const bookings = await Timetable.find({ academicYear: year._id, day: data.day, isActive: true, ...(id ? { _id: { $ne: id } } : {}) }).populate("teacherAssignment").populate("period").session(session);
    if (bookings.some(b => b.teacherAssignment && b.period && bookingConflict({ ...data, teacherAssignment: assignment, period }, b))) fail(409, "Teacher, class/section, or room overlaps an existing booking");
    Object.assign(row, data, { isActive: true, updatedBy: user._id });
    if (!id) row.createdBy = user._id;
    await row.save({ session }); return row;
  });
}
export async function timetableScope(user, filters = {}) {
  const query = { isActive: true };
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.schoolClass) query.schoolClass = filters.schoolClass;
  if (filters.section) query.section = filters.section;
  if (filters.teacher) query.teacher = filters.teacher;
  if (user.role === "Teacher") {
    const teacher = await Teacher.findOne({ user: user._id, isActive: true });
    if (!teacher || (filters.teacher && !same(filters.teacher, teacher))) fail(403, "Only your own schedule is available");
    query.teacher = teacher._id;
  } else if (user.role === "Student") {
    const student = await Student.findOne({ user: user._id, isActive: true });
    const placement = await placementAt(student, undefined, null, true);
    if (!student || (filters.schoolClass && !same(filters.schoolClass, placement?.schoolClass)) || (filters.section && !same(filters.section, placement?.section))) fail(403, "Only your own class schedule is available");
    if (!placement) return { _id: null };
    query.schoolClass = placement.schoolClass; query.section = placement.section;
  }
  const assignments = await TeacherAssignment.find(query);
  const eligible = [];
  for (const a of assignments) { try { await eligibleAssignment(a._id); eligible.push(a._id); } catch (error) { if (error.status !== 400) throw error; } }
  return { isActive: true, teacherAssignment: { $in: eligible }, ...(filters.day ? { day: filters.day } : {}) };
}
export const populateTimetable = q => q.populate({ path: "teacherAssignment", select: 'teacher subject schoolClass section academicYear isActive', populate: [{ path: "teacher", select: 'user isActive', populate: { path: "user", select: "fullname" } }, { path: "subject", select: "name code isActive" }, { path: "schoolClass", select: "name isActive" }, { path: "section", select: "name isActive" }] }).populate("period", 'name periodNumber startTime endTime isBreak isActive').populate("academicYear", "name isActive");
