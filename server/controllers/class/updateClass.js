import asyncHandler from "express-async-handler";
import SchoolClass from "../../models/SchoolClass.js";
import AcademicYear from "../../models/AcademicYear.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const updateClass = asyncHandler(async (req, res) => {
    const { name, academicYear, description } = req.body;

    const schoolClass = await SchoolClass.findById(req.params.id);

    if (!schoolClass) {
        res.status(404);
        throw new Error("Class not found");
    }

    // Check Academic Year
    if (academicYear) {
        const year = await AcademicYear.findById(academicYear);

        if (!year) {
            res.status(404);
            throw new Error("Academic Year not found");
        }
    }

    // Check duplicate
    const duplicate = await SchoolClass.findOne({
        _id: { $ne: req.params.id },
        name: name || schoolClass.name,
        academicYear: academicYear || schoolClass.academicYear,
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Class already exists in this academic year");
    }

    schoolClass.name = name ?? schoolClass.name;
    schoolClass.academicYear = academicYear ?? schoolClass.academicYear;
    schoolClass.description = description ?? schoolClass.description;

    await schoolClass.save();

    const updatedClass = await SchoolClass.findById(req.params.id)
        .populate("academicYear", "name startDate endDate isCurrent");

    sendResponse(res, 200, "class updated successfully", updatedClass);
});