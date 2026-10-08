import asyncHandler from "express-async-handler";
import Attendance from "../../models/Attendance.js";

export const deleteAttendance = asyncHandler(async (req, res) => {

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        res.status(404);
        throw new Error("Attendance not found");
    }

    attendance.isActive = false;

    await attendance.save();

    res.status(200).json({
        success: true,
        message: "Attendance deleted successfully"
    });

});