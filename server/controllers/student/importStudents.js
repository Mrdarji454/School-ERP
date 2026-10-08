import expressAsyncHandler from "express-async-handler";
import { importStudentsService } from "../../services/student/importStudentsService.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const importStudents = expressAsyncHandler(async (req, res) => {
    const result = await importStudentsService(req.file);

    sendResponse(
        res,
        200,
        "Students imported successfully",
        result
    );
});