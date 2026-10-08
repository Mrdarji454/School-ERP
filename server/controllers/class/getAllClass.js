import asyncHandler from "express-async-handler";
import SchoolClass from "../../models/SchoolClass.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const getAllClasses = asyncHandler(async (req, res) => {
    const classes = await SchoolClass.find({ isActive: true })
        .populate("academicYear", "name startDate endDate isCurrent")
        .sort({ createdAt: -1 });

    sendResponse(res, 200, "all classess finded", classes);
});