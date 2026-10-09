import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";
import { getAllStudentByIdService } from "../../services/student/getStudentByIdsService.js";

export const getStudentById = expressAsyncHandler(async (req, res) => {

    const student = await getAllStudentByIdService(req.params.id, req.user);
    sendResponse(res, 200, "", student);
});
