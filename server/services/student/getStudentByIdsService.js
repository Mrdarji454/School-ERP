import Student from "../../models/Student.js";
import { populateStudent, studentFilter } from "./studentCore.js";
import { fail } from "../../utils/errors.js";
export async function getAllStudentByIdService(id, user) {
 const student = await populateStudent(Student.findOne({ _id: id, ...await studentFilter({}, user) }));
 if (!student) fail(404, "Student not found");
 return student;
}
