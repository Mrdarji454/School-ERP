import asyncHandler from "express-async-handler";

import TeacherAssignment from "../../models/TeacherAssignment.js";
import Teacher from "../../models/Teacher.js";
import Subject from "../../models/Subject.js";
import SchoolClass from "../../models/SchoolClass.js";
import Section from "../../models/Section.js";
import AcademicYear from "../../models/AcademicYear.js";

export const createTeacherAssignment = asyncHandler(async (req, res) => {

    const {
        teacher,
        subject,
        schoolClass,
        section,
        academicYear,
        isClassTeacher,
        remarks,
    } = req.body;

    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
        res.status(404);
        throw new Error("Subject not found");
    }

    const classExists = await SchoolClass.findById(schoolClass);
    if (!classExists) {
        res.status(404);
        throw new Error("School Class not found");
    }

    const sectionExists = await Section.findById(section);
    if (!sectionExists) {
        res.status(404);
        throw new Error("Section not found");
    }

    const academicYearExists = await AcademicYear.findById(academicYear);
    if (!academicYearExists) {
        res.status(404);
        throw new Error("Academic Year not found");
    }

    const duplicate = await TeacherAssignment.findOne({
        teacher,
        subject,
        schoolClass,
        section,
        academicYear,
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Assignment already exists");
    }

    if (isClassTeacher) {

        const classTeacher = await TeacherAssignment.findOne({
            schoolClass,
            section,
            academicYear,
            isClassTeacher: true,
            isActive: true,
        });

        if (classTeacher) {
            res.status(400);
            throw new Error("This section already has a class teacher");
        }
    }

    const assignment = await TeacherAssignment.create({
        teacher,
        subject,
        schoolClass,
        section,
        academicYear,
        isClassTeacher,
        remarks,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Teacher assigned successfully",
        data: assignment,
    });

});