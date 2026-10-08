import { upadateAcademicYearService } from "../../services/academicYear/updateAcademincYearService.js";
import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";

export const upadateAcademicYear = expressAsyncHandler(async (req, res) => {
    const academicYear = await upadateAcademicYearService(req.params.id, req.body);
    
    sendResponse(res, 200, "academic Year updated successfully", academicYear);
})