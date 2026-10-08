import asyncHandler from "express-async-handler";

import AcademicCalendar from "../../models/AcademicCalendar.js";
import AcademicYear from "../../models/AcademicYear.js";

export const updateAcademicCalendar = asyncHandler(async (req, res) => {

    const calendar = await AcademicCalendar.findById(req.params.id);

    if (!calendar) {
        res.status(404);
        throw new Error("Calendar entry not found");
    }

    const {
        academicYear,
        title,
        description,
        type,
        startDate,
        endDate,
    } = req.body;

    if (academicYear) {

        const year = await AcademicYear.findById(academicYear);

        if (!year) {
            res.status(404);
            throw new Error("Academic Year not found");
        }

        calendar.academicYear = academicYear;
    }

    if (
        startDate &&
        endDate &&
        new Date(startDate) > new Date(endDate)
    ) {
        res.status(400);
        throw new Error("Start date cannot be after end date");
    }

    calendar.title = title ?? calendar.title;
    calendar.description = description ?? calendar.description;
    calendar.type = type ?? calendar.type;
    calendar.startDate = startDate ?? calendar.startDate;
    calendar.endDate = endDate ?? calendar.endDate;
    calendar.updatedBy = req.user._id;

    await calendar.save();

    res.status(200).json({
        success: true,
        message: "Calendar updated successfully",
        data: calendar,
    });

});