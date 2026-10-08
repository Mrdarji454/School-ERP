import { sendResponse } from "../../utils/apiResponse";
import Student from "../../models/Student.js";

export const restoreStudentService = async (id) => {
    const student = await Student.findById(id);

    if (!student) {
        sendResponse(res, 404, "Student not found");
    }
    student.isActive = true;

    await student.save();
    return student;
}