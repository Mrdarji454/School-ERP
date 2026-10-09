import AcademicYear from "../models/AcademicYear.js";
import SchoolClass from "../models/SchoolClass.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import { fail } from "./errors.js";
export const same = (a, b) => String(a?._id || a) === String(b?._id || b);
export async function active(Model, id, session = null) {
  const doc = await Model.findOne({ _id: id, isActive: true }).session(session);
  if (!doc) fail(400, `${Model.modelName} is missing or inactive`);
  return doc;
}
export async function classSection(schoolClass, section, session = null) {
  const cls = await active(SchoolClass, schoolClass, session);
  await active(AcademicYear, cls.academicYear, session);
  if (section) {
    const sec = await active(Section, section, session);
    if (!same(sec.schoolClass, cls)) fail(400, "Section does not belong to the selected class");
  }
  return cls;
}
export async function assignmentRelations(data, session = null) {
  const cls = await classSection(data.schoolClass, data.section, session);
  if (!same(cls.academicYear, data.academicYear)) fail(400, "Class and assignment academic years differ");
  const subject = await active(Subject, data.subject, session);
  if (!same(subject.schoolClass, cls)) fail(400, "Subject does not belong to this class");
  const teacher = await active(Teacher, data.teacher, session);
  await active(User, teacher.user, session);
  return data;
}
export async function eligibleAssignment(id, user, session = null) {
  const assignment = await active(TeacherAssignment, id, session);
  await assignmentRelations(assignment, session);
  if (user?.role === "Teacher") {
    const teacher = await Teacher.findOne({ user: user._id, isActive: true }).session(session);
    if (!teacher || !same(assignment.teacher, teacher)) fail(403, "This assignment belongs to another teacher");
  }
  return assignment;
}
