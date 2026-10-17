import expressasynchandler from "express-async-handler";
import mongoose from "mongoose";
import Student from "../../models/Student.js";
import { createStudentService } from "../../services/student/createStudentService.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const createStudent = expressasynchandler(async (req, res) => {
    // const session = await mongoose.startSession();
    // session.startTransaction();
    const student = await createStudentService(req.body, req.user);


    sendResponse(res, 201, "Student created successfully", student);
});

