import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";
export const restoreStudent = expressAsyncHandler(async (req, res) => {

    const student = await restoreStudentService(req.params.id);
    sendResponse(res, 200, "Student restored successfully", student);
});