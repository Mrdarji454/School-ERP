import asyncHandler from "express-async-handler";

import Timetable from "../../models/Timetable.js";
import TeacherAssignment from "../../models/TeacherAssignment.js";
import AcademicYear from "../../models/AcademicYear.js";

export const createTimetable = asyncHandler(async (req, res) => {

    const {
        academicYear,
        teacherAssignment,
        period,
        day,
        roomNumber,
    } = req.body;
    // Check Academic Year
    const academicYearExists = await AcademicYear.findById(academicYear);

    if (!academicYearExists) {
        res.status(404);
        throw new Error("Academic Year not found");
    }

    // Check Teacher Assignment
    const assignment = await TeacherAssignment.findById(teacherAssignment);

    if (!assignment) {
        res.status(404);
        throw new Error("Teacher Assignment not found");
    }

    // Duplicate Check
    const duplicate = await Timetable.findOne({
        teacherAssignment,
        day,
        period,
        academicYear,
        isActive: true,
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Timetable already exists");
    }
    const periodExists = await Period.findById(period);

    if (!periodExists) {
        res.status(404);
        throw new Error("Period not found");
    }

    // Teacher Conflict
    const teacherConflict = await Timetable.findOne({
        academicYear,
        day,
        period,
        isActive: true,
    }).populate("teacherAssignment");

    if (
        teacherConflict &&
        teacherConflict.teacherAssignment.teacher.toString() ===
        assignment.teacher.toString()
    ) {
        res.status(400);
        throw new Error(
            "Teacher is already assigned to another class during this period"
        );
    }

    // Class Conflict
    const classConflict = await Timetable.findOne({
        academicYear,
        day,
        period,
        isActive: true,
    }).populate("teacherAssignment").populate("period");

    if (
        classConflict &&
        classConflict.teacherAssignment.schoolClass.toString() ===
        assignment.schoolClass.toString() &&
        classConflict.teacherAssignment.section.toString() ===
        assignment.section.toString()
    ) {
        res.status(400);
        throw new Error(
            "This class already has another subject during this period"
        );
    }

    const timetable = await Timetable.create({
        academicYear,
        teacherAssignment,
        day,
        period,
        roomNumber,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Timetable created successfully",
        data: timetable,
    });

});