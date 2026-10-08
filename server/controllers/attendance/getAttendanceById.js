import asyncHandler from "express-async-handler";
import Attendance from "../../models/Attendance.js";

export const getAttendanceById = asyncHandler(async (req, res) => {

    const attendance = await Attendance.findById(req.params.id)

        .populate({
            path: "teacherAssignment",
            populate: [
                {
                    path: "teacher",
                    populate: {
                        path: "user",
                        select: "fullName email"
                    }
                },
                {
                    path: "subject",
                    select: "name code"
                },
                {
                    path: "schoolClass",
                    select: "name"
                },
                {
                    path: "section",
                    select: "name"
                },
                {
                    path: "academicYear",
                    select: "name"
                }
            ]
        })

        .populate("students.student", "fullname admissionNo rollNumber")

        .populate("markedBy", "fullName email");

    if (!attendance) {
        res.status(404);
        throw new Error("Attendance not found");
    }

    res.status(200).json({
        success: true,
        data: attendance
    });

});