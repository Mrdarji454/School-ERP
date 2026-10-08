import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";
import { updateStudentServices } from "../../services/student/updateStudentService.js";

export const updateStudent = expressAsyncHandler(async (req, res) => {

    const student = await updateStudentServices(req.params.id, req.body);
    sendResponse(res, 200, "user upadated successfully", student);

});