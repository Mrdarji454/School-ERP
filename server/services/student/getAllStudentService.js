import Student from "../../models/Student.js";
import { populateStudent, studentFilter } from "./studentCore.js";
export async function getAllStudentService(query, user) {
 const limit = Math.min(100, Math.max(1, Math.trunc(Number(query.limit)) || 10));
 const filter = await studentFilter(query, user);
 const [totalStudents] = await Promise.all([Student.countDocuments(filter)]);
 const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
 const page = Math.min(totalPages, Math.max(1, Math.trunc(Number(query.page)) || 1));
 const students = await populateStudent(Student.find(filter)).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit);
 const statsFilter = { ...filter }; delete statsFilter.isActive;
 const [total, activeTotal] = await Promise.all([Student.countDocuments(statsFilter), Student.countDocuments({ ...statsFilter, isActive: true })]);
 const classes = (await Student.distinct("schoolClass", statsFilter)).length;
 return { students, pagination: { page, limit, totalStudents, totalPages }, statistics: { classes, total, active: activeTotal, inactive: total - activeTotal } };
}
