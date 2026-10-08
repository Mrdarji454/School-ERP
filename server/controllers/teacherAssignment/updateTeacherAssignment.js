import asyncHandler from "express-async-handler";

import TeacherAssignment from "../../models/TeacherAssignment.js";
import Teacher from "../../models/Teacher.js";
import Subject from "../../models/Subject.js";
import SchoolClass from "../../models/SchoolClass.js";
import Section from "../../models/Section.js";
import AcademicYear from "../../models/AcademicYear.js";

export const updateTeacherAssignment = asyncHandler(async (req, res) => {

    const assignment = await TeacherAssignment.findById(req.params.id);

    if (!assignment) {
        res.status(404);
        throw new Error("Teacher Assignment not found");
    }

    const {
        teacher,
        subject,
        schoolClass,
        section,
        academicYear,
        isClassTeacher,
        remarks,
    } = req.body;

    if (teacher && !(await Teacher.findById(teacher)))
        throw new Error("Teacher not found");

    if (subject && !(await Subject.findById(subject)))
        throw new Error("Subject not found");

    if (schoolClass && !(await SchoolClass.findById(schoolClass)))
        throw new Error("School Class not found");

    if (section && !(await Section.findById(section)))
        throw new Error("Section not found");

    if (academicYear && !(await AcademicYear.findById(academicYear)))
        throw new Error("Academic Year not found");

    const duplicate = await TeacherAssignment.findOne({
        _id: { $ne: req.params.id },
        teacher: teacher ?? assignment.teacher,
        subject: subject ?? assignment.subject,
        schoolClass: schoolClass ?? assignment.schoolClass,
        section: section ?? assignment.section,
        academicYear: academicYear ?? assignment.academicYear,
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Assignment already exists");
    }

    assignment.teacher = teacher ?? assignment.teacher;
    assignment.subject = subject ?? assignment.subject;
    assignment.schoolClass = schoolClass ?? assignment.schoolClass;
    assignment.section = section ?? assignment.section;
    assignment.academicYear = academicYear ?? assignment.academicYear;
    assignment.isClassTeacher = isClassTeacher ?? assignment.isClassTeacher;
    assignment.remarks = remarks ?? assignment.remarks;
    assignment.updatedBy = req.user._id;

    await assignment.save();

    res.status(200).json({
        success: true,
        message: "Teacher Assignment updated successfully",
        data: assignment,
    });

});