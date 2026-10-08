import AcademicYear from "../../models/AcademicYear.js";
import expressAsyncHandler from "express-async-handler";
import { sendResponse } from "../../utils/apiResponse.js";

export const setCurrentAcademicYear = expressAsyncHandler(async (req, res) => {
    await AcademicYear.updateMany({}, {
        isCurrent: false
    });

    const academicYear = await AcademicYear.findById(req.params.id);

    if (!academicYear) {
        sendResponse(res, 404, "academic year not found");
    }
    academicYear.isCurrent = true;

    await academicYear.save();
    sendResponse(res, 200, "current academic year seted", academicYear);
})