import { randomUUID } from "node:crypto";
import validator from "validator";
import Student from "../../models/Student.js";
import User from "../../models/User.js";
import SchoolClass from "../../models/SchoolClass.js";
import Teacher from "../../models/Teacher.js";
import TeacherAssignment from "../../models/TeacherAssignment.js";
import { classSection, eligibleAssignment } from "../../utils/relationships.js";
import { transaction } from "../../utils/transaction.js";
import { fail } from "../../utils/errors.js";
export const studentFields = ["rollNumber", "schoolClass", "section", "fatherName", "motherName", "dob", "gender", "phone", "address", "bloodGroup"];
export const populateStudent = query => query.populate("user", "fullname email phone isActive").populate("schoolClass", "name academicYear").populate("section", "name schoolClass");
export function validateStudent(data, creating = false) {
  if (data.phone && (typeof data.phone !== "string" || !/^\d{10}$/.test(data.phone))) fail(400, "Phone must contain 10 digits");
  if (creating || data.fullname !== undefined) if (typeof data.fullname !== "string" || !data.fullname.trim()) fail(400, "Full name is required");
  if (creating || data.email !== undefined) if (typeof data.email !== "string" || !validator.isEmail(data.email)) fail(400, "Valid email is required");
  if (creating || data.password) if (typeof data.password !== "string" || data.password.length < 8) fail(400, "Password must contain at least 8 characters");
  if (creating || data.rollNumber !== undefined) if (!Number.isInteger(Number(data.rollNumber)) || Number(data.rollNumber) < 1) fail(400, "Roll number must be a positive integer");
  if (creating || data.dob !== undefined) if (!data.dob || Number.isNaN(new Date(data.dob).getTime()) || new Date(data.dob) > new Date()) fail(400, "A valid past date of birth is required");
  if (creating || data.gender !== undefined) if (!["Male", "Female", "Other"].includes(data.gender)) fail(400, "Invalid gender");
}
export async function createProfile(data) {
  validateStudent(data, true);
  const id = await transaction(async session => {
    await classSection(data.schoolClass, data.section, session);
    const [user] = await User.create([{ fullname: data.fullname, email: data.email, password: data.password, phone: data.phone, role: "Student" }], { session });
    const fields = Object.fromEntries(studentFields.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
    const [student] = await Student.create([{ ...fields, user: user._id, admissionNo: data.admissionNo || `ADM${new Date().getFullYear()}-${randomUUID()}` }], { session });
    return student._id;
  });
  return populateStudent(Student.findById(id));
}
export async function updateProfile(id, data) {
  validateStudent(data);
  await transaction(async session => {
    const student = await Student.findById(id).session(session);
    if (!student) fail(404, "Student not found");
    await classSection(data.schoolClass || student.schoolClass, data.section || student.section, session);
    const user = await User.findById(student.user).session(session);
    if (!user) fail(404, "Student account not found");
    for (const key of ["fullname", "email", "phone"]) if (data[key] !== undefined) user[key] = data[key];
    if (data.password) user.password = data.password;
    for (const key of studentFields) if (data[key] !== undefined) student[key] = data[key];
    await user.save({ session }); await student.save({ session });
  });
  return populateStudent(Student.findById(id));
}
export async function setStudentActive(id, isActive) {
  await transaction(async session => {
    const student = await Student.findById(id).session(session);
    if (!student) fail(404, "Student not found");
    if (isActive) await classSection(student.schoolClass, student.section, session);
    student.isActive = isActive; await student.save({ session });
    const user = await User.findByIdAndUpdate(student.user, { $set: { isActive } }, { session });
    if (!user) fail(404, "Student account not found");
  });
  return populateStudent(Student.findById(id));
}
export async function studentFilter(query, user) {
  const filter = {};
  if (user?.role === "Teacher") {
    const teacher = await Teacher.findOne({ user: user._id, isActive: true });
    if (!teacher) fail(403, "Active teacher profile required");
    const candidates = await TeacherAssignment.find({ teacher: teacher._id, isActive: true });
    const assignments = [];
    for (const assignment of candidates) {
      try { await eligibleAssignment(assignment._id, user); assignments.push(assignment); }
      catch (error) { if (error.status !== 400) throw error; }
    }
    filter.$and = [{ isActive: true }, assignments.length ? { $or: assignments.map(a => ({ schoolClass: a.schoolClass, section: a.section })) } : { _id: { $in: [] } }];
  }
  if (query.status !== undefined && query.status !== "") {
    if (!["true", "false"].includes(query.status)) fail(400, "Invalid status");
    filter.isActive = query.status === "true";
  }
  if (query.schoolClass) filter.schoolClass = query.schoolClass;
  if (query.section) filter.section = query.section;
  if (query.academicYear) {
    const classes = await SchoolClass.find({ academicYear: query.academicYear }).select("_id");
    filter.schoolClass = { $in: classes.map(c => c._id).filter(id => !query.schoolClass || String(id) === query.schoolClass) };
  }
  if (query.search) {
    const escaped = String(query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({ $or: [{ fullname: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }] }).select("_id");
    filter.$or = [{ user: { $in: users.map(u => u._id) } }, { admissionNo: { $regex: escaped, $options: "i" } }];
  }
  return filter;
}
