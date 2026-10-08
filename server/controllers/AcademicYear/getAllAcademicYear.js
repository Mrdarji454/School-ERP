import { getAllAcademicYearService } from "../../services/academicYear/getAllAcademicYearService.js";
import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";

export const getAllAcademicYear = expressAsyncHandler(async (req, res) => {
    const academicYears = await getAllAcademicYearService(req, res);
    console.log(academicYears);
    sendResponse(res, 200, "acadamic years found successfully", academicYears, (await academicYears).length);
});