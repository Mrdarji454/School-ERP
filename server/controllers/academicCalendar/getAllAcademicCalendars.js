import asyncHandler from "express-async-handler";
import AcademicCalendar from "../../models/AcademicCalendar.js";

export const getAllAcademicCalendars = asyncHandler(async (req, res) => {

    const calendars = await AcademicCalendar.find({
        isActive: true,
    })
        .populate("academicYear", "name")
        .populate("createdBy", "fullName email")
        .sort({
            startDate: 1,
        });

    res.status(200).json({
        success: true,
        count: calendars.length,
        data: calendars,
    });

});