import asyncHandler from "express-async-handler";
import AcademicYear from "../models/AcademicYear.js";
import SchoolClass from "../models/SchoolClass.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Period from "../models/Period.js";
import Timetable from "../models/TimeTable.js";
import Enrollment from '../models/Enrollment.js';
import { active, classSection, assignmentRelations, same } from "../utils/relationships.js";
import { fail } from "../utils/errors.js";
const models = { class: SchoolClass, section: Section, subject: Subject, assignment: TeacherAssignment, period: Period, year: AcademicYear };
export const academicRelations = kind => asyncHandler(async (req, res, next) => {
  const Model = models[kind];
  const old = req.params.id ? await Model.findById(req.params.id) : null;
  if (req.params.id && !old) fail(404, "Record not found");
  const data = { ...old?.toObject(), ...req.body };
  if (kind === "class") await active(AcademicYear, data.academicYear);
  if (["section", "subject"].includes(kind)) await classSection(data.schoolClass);
  if (kind === "section" && data.classTeacher) await active(Teacher, data.classTeacher);
  if (kind === "assignment") await assignmentRelations(data);
  // Moving existing academic entities invalidates rosters and historical references.
  const immutable = { class: ["academicYear"], section: ["schoolClass"], subject: ["schoolClass"], assignment: ["academicYear", "schoolClass", "section", "teacher", "subject"] }[kind] || [];
  if (old && immutable.some(key => !same(old[key], data[key]))) fail(409, "Create a new record instead of moving an existing academic relationship");
  if (kind === "year" && (!(new Date(data.startDate) < new Date(data.endDate)))) fail(400, "Academic year end date must follow start date");
  if (kind === 'year' && old && ['startDate', 'endDate'].some(key => new Date(old[key]).getTime() !== new Date(data[key]).getTime()) && await Enrollment.exists({ academicYear: old._id })) fail(409, 'Academic-year dates with established enrollments cannot change; preserve their historical boundaries');
  if (kind === "period") {
    const valid = value => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (!valid(data.startTime) || !valid(data.endTime) || data.startTime >= data.endTime) fail(400, "Use valid HH:mm times with end after start");
    if (old && ["startTime", "endTime", "isBreak"].some(key => old[key] !== data[key]) && await Timetable.exists({ period: old._id })) fail(409, "A scheduled period cannot change its time or break status; create a new period");
  }
  next();
});
export const restoreAcademic = kind => asyncHandler(async (req, res) => {
  const row = await models[kind].findById(req.params.id);
  if (!row) fail(404, "Record not found");
  if (kind === "class") await active(AcademicYear, row.academicYear);
  if (["section", "subject"].includes(kind)) await classSection(row.schoolClass);
  if (kind === "assignment") await assignmentRelations(row);
  row.isActive = true; await row.save(); res.json({ success: true, data: row });
});
