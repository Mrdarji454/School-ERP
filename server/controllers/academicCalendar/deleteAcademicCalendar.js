import asyncHandler from "express-async-handler";
import AcademicCalendar from "../../models/AcademicCalendar.js";

export const deleteAcademicCalendar = asyncHandler(async (req, res) => {

    const calendar = await AcademicCalendar.findById(req.params.id);

    if (!calendar) {
        res.status(404);
        throw new Error("Calendar entry not found");
    }

    calendar.isActive = false;
    calendar.updatedBy = req.user._id;

    await calendar.save();

    res.status(200).json({
        success: true,
        message: "Calendar deleted successfully",
    });

});