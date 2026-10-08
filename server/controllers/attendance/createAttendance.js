import asyncHandler from "express-async-handler";

import Attendance from "../../models/Attendance.js";
import TeacherAssignment from "../../models/TeacherAssignment.js";
import Student from "../../models/Student.js";

export const createAttendance = asyncHandler(async (req, res) => {

    const {
        teacherAssignment,
        attendanceDate,
        period,
        students,
    } = req.body;

    // Check Teacher Assignment
    const assignment = await TeacherAssignment.findById(teacherAssignment)
        .populate("schoolClass")
        .populate("section");

    if (!assignment) {
        res.status(404);
        throw new Error("Teacher Assignment not found");
    }

    // Duplicate Attendance Check
    const existingAttendance = await Attendance.findOne({
        teacherAssignment,
        attendanceDate,
        period,
        isActive: true,
    });

    if (existingAttendance) {
        res.status(400);
        throw new Error("Attendance already marked for this period");
    }
    const periodExists = await Period.findById(period);

    if (!periodExists) {
        res.status(404);
        throw new Error("Period not found");
    }
    // Validate Students
    for (const item of students) {

        const student = await Student.findById(item.student);

        if (!student) {
            res.status(404);
            throw new Error(`Student not found: ${item.student}`);
        }

        // If your Student model uses ObjectId references:
        if (
            student.schoolClass?.toString() !== assignment.schoolClass._id.toString() ||
            student.section?.toString() !== assignment.section._id.toString()
        ) {
            res.status(400);
            throw new Error(
                `${student.fullName} does not belong to this class/section`
            );
        }
    }

    const attendance = await Attendance.create({
        teacherAssignment,
        attendanceDate,
        period,
        students,
        markedBy: req.user._id,
    });

    res.status(201).json({

        success: true,
        message: "Attendance marked successfully",
        data: attendance,

    });

});