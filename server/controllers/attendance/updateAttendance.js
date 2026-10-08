import asyncHandler from "express-async-handler";
import Attendance from "../../models/Attendance.js";
import Student from "../../models/Student.js";

export const updateAttendance = asyncHandler(async (req, res) => {

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        res.status(404);
        throw new Error("Attendance not found");
    }

    if (attendance.isLocked) {
        res.status(400);
        throw new Error("Attendance is locked");
    }

    const { students } = req.body;

    for (const item of students) {

        const student = await Student.findById(item.student);

        if (!student) {
            res.status(404);
            throw new Error("Student not found");
        }

    }

    attendance.students = students;
    attendance.markedBy = req.user._id;

    await attendance.save();

    res.status(200).json({
        success: true,
        message: "Attendance updated successfully",
        data: attendance
    });

});