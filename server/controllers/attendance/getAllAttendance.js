import asyncHandler from "express-async-handler";
import Attendance from "../../models/Attendance.js";

export const getAllAttendance = asyncHandler(async (req, res) => {

    const attendance = await Attendance.find({ isActive: true })

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

        .populate({
            path: "students.student",
            select: "fullname admissionNo rollNumber"
        })

        .populate("markedBy", "fullName email")

        .sort({
            attendanceDate: -1,
            period: 1
        });

    res.status(200).json({
        success: true,
        count: attendance.length,
        data: attendance
    });

});