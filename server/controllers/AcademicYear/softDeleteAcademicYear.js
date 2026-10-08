import AcademicYear from "../../models/AcademicYear.js";
import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";
import { restoreStudent } from "../student/restoreStudent.js";

export const deleteAcademicYear = expressAsyncHandler(async (req, res) => {

    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
        sendResponse(res, 404, " academicYear not found");
    }

    academicYear.isActive = false;
    await academicYear.save();
    sendResponse(res, 200, "academicyear deleted", academicYear);

});
export const restoreAcademicYear = expressAsyncHandler(async (req, res) => {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
        sendResponse(res, 404, " academicYear not found");
    }

    academicYear.isActive = true;
    await academicYear.save();
    sendResponse(res, 200, "academicyear restored", academicYear);

})