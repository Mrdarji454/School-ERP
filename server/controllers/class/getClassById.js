import asyncHandler from "express-async-handler";
import SchoolClass from "../../models/SchoolClass.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const getClassById = asyncHandler(async (req, res) => {
    const schoolClass = await SchoolClass.findById(req.params.id)
        .populate("academicYear", "name startDate endDate isCurrent");

    if (!schoolClass) {
        res.status(404);
        throw new Error("Class not found");
    }

    sendResponse(res, 200, "Class found successfully", schoolClass);
});