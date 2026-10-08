import { sendResponse } from "../../utils/apiResponse.js";
import Student from "../../models/Student.js";

export const deleteStudentService = async (query) => {
    const student = await Student.findById(id);
    if (!student) {
        sendResponse(res, 404, "Student not found");
    }

    student.isActive = false;
    await student.save();
    return student;
}