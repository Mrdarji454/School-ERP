import Student from "../../models/Student.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const getAllStudentByIdService = async (id) => {

    const student = await Student.findById(id).populate({
        path: "user",
        select: "-password",
    });
    if (!student) {
        sendResponse(res, 404, "Student not found");

    }
    return student;
}