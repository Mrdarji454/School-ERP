import asyncHandler from "express-async-handler";
import AcademicCalendar from "../../models/AcademicCalendar.js";

export const getAcademicCalendarById = asyncHandler(async (req, res) => {

    const calendar = await AcademicCalendar.findOne({ _id: req.params.id, ...(req.user.role === "Admin" ? {} : { isActive: true }) })
        .populate("academicYear", "name")
        .populate("createdBy", "fullname email");

    if (!calendar) {
        res.status(404);
        throw new Error("Calendar entry not found");
    }

    res.status(200).json({
        success: true,
        data: calendar,
    });

});