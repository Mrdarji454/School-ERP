import asyncHandler from "express-async-handler";

import AcademicCalendar from "../../models/AcademicCalendar.js";
import AcademicYear from "../../models/AcademicYear.js";

export const createAcademicCalendar = asyncHandler(async (req, res) => {

    const {
        academicYear,
        title,
        description,
        type,
        startDate,
        endDate,
    } = req.body;

    const year = await AcademicYear.findById(academicYear);

    if (!year) {
        res.status(404);
        throw new Error("Academic Year not found");
    }

    if (new Date(startDate) > new Date(endDate)) {
        res.status(400);
        throw new Error("Start date cannot be after end date");
    }

    const calendar = await AcademicCalendar.create({

        academicYear,
        title,
        description,
        type,
        startDate,
        endDate,
        createdBy: req.user._id,

    });

    res.status(201).json({

        success: true,
        message: "Calendar entry created successfully",
        data: calendar,

    });

});