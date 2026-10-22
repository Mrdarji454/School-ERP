import mongoose from "mongoose";
import AcademicYear from "../models/AcademicYear.js";
import SchoolClass from "../models/SchoolClass.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import Period from "../models/Period.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Timetable from "../models/TimeTable.js";
import Enrollment from "../models/Enrollment.js";
import { fail } from "../utils/errors.js";

const classPopulation = { path: "schoolClass", select: "name academicYear isActive", populate: { path: "academicYear", select: "name isCurrent isActive" } };
const teacherPopulation = { path: "teacher", select: "user employeeId isActive", populate: { path: "user", select: "fullname isActive" } };
const config = {
  "academic-years": { Model: AcademicYear, search: ["name"], sort: { startDate: -1, _id: 1 } },
  classes: { Model: SchoolClass, search: ["name", "description"], populate: [{ path: "academicYear", select: "name isCurrent isActive" }] },
  sections: { Model: Section, search: ["name", "description"], populate: [classPopulation, { path: "classTeacher", select: "user employeeId isActive", populate: { path: "user", select: "fullname isActive" } }] },
  subjects: { Model: Subject, search: ["name", "code", "description"], populate: [classPopulation] },
  periods: { Model: Period, search: ["name", "description"], sort: { periodNumber: 1, _id: 1 } },
  teachers: { Model: Teacher, search: ["employeeId", "qualification", "designation", "department"], select: "-salary -photo", populate: [{ path: "user", select: "fullname email phone isActive" }] },
  "teacher-assignments": { Model: TeacherAssignment, search: ["remarks"], populate: [classPopulation, teacherPopulation, { path: "section", select: "name schoolClass isActive" }, { path: "subject", select: "name code schoolClass isActive" }, { path: "academicYear", select: "name isCurrent isActive" }] },
};
function id(value, name) {
  if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value)) fail(400, `${name} must be a valid identifier`);
  return value;
}
const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function listManagement(resource, query) {
  const entry = Object.hasOwn(config, resource) ? config[resource] : null;
  if (!entry) fail(404, "Management resource not found");
  for (const key of ["search", "status", "academicYear", "schoolClass", "section", "teacher", "subject", "page", "limit"]) if (query[key] !== undefined && typeof query[key] !== "string") fail(400, `Invalid ${key} filter`);
  if (query.status && !["all", "active", "inactive"].includes(query.status)) fail(400, "Invalid status filter");
  const requestedPage = Number(query.page || 1), limit = Number(query.limit || 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail(400, "Page must be positive and page size must be 1–100");
  const filter = {};
  if (query.status && query.status !== "all") filter.isActive = query.status === "active";
  if (query.academicYear) {
    const year = id(query.academicYear, "Academic year");
    if (["classes", "teacher-assignments"].includes(resource)) filter.academicYear = year;
    if (["sections", "subjects"].includes(resource)) filter.schoolClass = { $in: await SchoolClass.find({ academicYear: year }).distinct("_id") };
  }
  if (query.schoolClass && ["sections", "subjects", "teacher-assignments"].includes(resource)) {
    const cls = id(query.schoolClass, "Class");
    if (filter.schoolClass?.$in && !filter.schoolClass.$in.some(value => String(value) === cls)) filter.schoolClass = { $in: [] };
    else filter.schoolClass = cls;
  }
  if (resource === "teacher-assignments") for (const key of ["teacher", "section", "subject"]) if (query[key]) filter[key] = id(query[key], key);
  if (query.search?.trim()) {
    if (query.search.length > 100) fail(400, "Search must be 100 characters or fewer");
    const regex = { $regex: escaped(query.search.trim()), $options: "i" };
    filter.$or = entry.search.map(key => ({ [key]: regex }));
    if (["teachers", "teacher-assignments"].includes(resource)) {
      const users = await User.find({ role: "Teacher", $or: [{ fullname: regex }, { email: regex }] }).distinct("_id");
      if (resource === "teachers") filter.$or.push({ user: { $in: users } });
      else {
        const teachers = await Teacher.find({ $or: [{ user: { $in: users } }, { employeeId: regex }] }).distinct("_id");
        const subjects = await Subject.find({ $or: [{ name: regex }, { code: regex }] }).distinct("_id");
        filter.$or.push({ teacher: { $in: teachers } }, { subject: { $in: subjects } });
      }
    }
  }
  const total = await entry.Model.countDocuments(filter), totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requestedPage, totalPages);
  let recordsQuery = entry.Model.find(filter).sort(entry.sort || { createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit);
  if (entry.select) recordsQuery = recordsQuery.select(entry.select);
  for (const population of entry.populate || []) recordsQuery = recordsQuery.populate(population);
  const records = await recordsQuery.lean();
  const ids = records.map(record => record._id);
  // Read-only, page-scoped UI metadata. The write endpoints remain authoritative
  // if a dependency is added after this response was loaded.
  if (ids.length && resource === 'periods') {
    const scheduled = new Set((await Timetable.distinct('period', { period: { $in: ids } })).map(String));
    for (const record of records) record.isScheduled = scheduled.has(String(record._id));
  }
  if (ids.length && resource === 'academic-years') {
    const enrolled = new Set((await Enrollment.distinct('academicYear', { academicYear: { $in: ids } })).map(String));
    for (const record of records) record.hasEnrollments = enrolled.has(String(record._id));
  }
  if (ids.length && resource === 'classes') {
    const [sections, students] = await Promise.all([
      Section.aggregate([{ $match: { schoolClass: { $in: ids } } }, { $group: { _id: '$schoolClass', count: { $sum: 1 } } }]),
      Student.aggregate([{ $match: { schoolClass: { $in: ids }, isActive: true } }, { $group: { _id: '$schoolClass', count: { $sum: 1 } } }]),
    ]);
    const sectionCounts = new Map(sections.map(row => [String(row._id), row.count]));
    const studentCounts = new Map(students.map(row => [String(row._id), row.count]));
    for (const record of records) { record.sectionCount = sectionCounts.get(String(record._id)) || 0; record.studentCount = studentCounts.get(String(record._id)) || 0; }
  }
  return { records, pagination: { page, limit, total, totalPages } };
}

export async function managementOptions() {
  // Minimal labels/relationships only: never fetch salaries, credentials, or contact/profile fields.
  const [years, classes, sections, subjects, teachers] = await Promise.all([
    AcademicYear.find().select("name isCurrent isActive").sort({ startDate: -1 }).lean(),
    SchoolClass.find().select("name academicYear isActive").sort({ name: 1 }).lean(),
    Section.find().select("name schoolClass isActive").sort({ name: 1 }).lean(),
    Subject.find().select("name code schoolClass isActive").sort({ name: 1 }).lean(),
    Teacher.find().select("user employeeId isActive").populate("user", "fullname isActive").sort({ employeeId: 1 }).lean(),
  ]);
  const activeYears = new Set(years.filter(y => y.isActive).map(y => String(y._id)));
  const eligibleClasses = new Set(classes.filter(c => c.isActive && activeYears.has(String(c.academicYear))).map(c => String(c._id)));
  return {
    years: years.map(y => ({ ...y, eligible: y.isActive })),
    classes: classes.map(c => ({ ...c, eligible: eligibleClasses.has(String(c._id)) })),
    sections: sections.map(s => ({ ...s, eligible: s.isActive && eligibleClasses.has(String(s.schoolClass)) })),
    subjects: subjects.map(s => ({ ...s, eligible: s.isActive && eligibleClasses.has(String(s.schoolClass)) })),
    teachers: teachers.map(t => ({ _id: t._id, employeeId: t.employeeId, name: t.user?.fullname || "Missing account", isActive: t.isActive, eligible: Boolean(t.isActive && t.user?.isActive) })),
  };
}

export async function classDependencies(classId) {
  id(classId, "Class");
  if (!await SchoolClass.exists({ _id: classId })) fail(404, "Class not found");
  const pairs = [["sections", Section], ["subjects", Subject], ["students", Student], ["assignments", TeacherAssignment]];
  return Object.fromEntries(await Promise.all(pairs.map(async ([key, Model]) => [key, { total: await Model.countDocuments({ schoolClass: classId }), active: await Model.countDocuments({ schoolClass: classId, isActive: true }) }])));
}
