import expressAsyncHandler from "express-async-handler";
import getAcademicYearByIdService from "../../services/academicYear/getAcademicYearByIdService.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const getAcademicYearById = expressAsyncHandler(async (req, res) => {
    const academicYear = await getAcademicYearByIdService(req.params.id);
    sendResponse(res, 200, "academicyear Found", academicYear);
});