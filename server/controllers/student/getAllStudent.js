import expressAsyncHandler from "express-async-handler";
import { getAllStudentService } from "../../services/student/getAllStudentService.js";
import { sendResponse } from "../../utils/apiResponse.js";
export const getAllStudent = expressAsyncHandler(async (req, res) => {

    const result = await getAllStudentService(req.query)
    sendResponse(res, 200, "Student created successfully", result);

});