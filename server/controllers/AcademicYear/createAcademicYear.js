import expressAsyncHandler from "express-async-handler";
import { createAcademicYearService } from "../../services/academicYear/createAcademicYearService.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const createAcademicYear = expressAsyncHandler(async (req, res) => {

    const academicYear = await createAcademicYearService(req.body);
    sendResponse(res, 200, "Academic year created successfully", academicYear);
});