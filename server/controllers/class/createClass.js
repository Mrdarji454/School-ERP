import asyncHandler from "express-async-handler";
import SchoolClass from "../../models/SchoolClass.js";
import AcademicYear from "../../models/AcademicYear.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const createClass = asyncHandler(async (req, res) => {

    const {
        name,
        academicYear,
        description
    } = req.body;

    // Check Academic Year exists
    const year = await AcademicYear.findById(academicYear);

    if (!year) {
        res.status(404);
        throw new Error("Academic Year not found");
    }

    // Check duplicate class in same academic year
    const existingClass = await SchoolClass.findOne({
        name,
        academicYear
    });

    if (existingClass) {
        res.status(400);
        throw new Error("Class already exists in this academic year");
    }

    // Create class
    const schoolClass = await SchoolClass.create({
        name,
        academicYear,
        description
    });

    sendResponse(res, 200, "class created successfully", schoolClass);

});