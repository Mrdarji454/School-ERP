import asyncHandler from "express-async-handler";
import TeacherAssignment from "../../models/TeacherAssignment.js";

export const getAllTeacherAssignments = asyncHandler(async (req, res) => {

    const assignments = await TeacherAssignment.find({ isActive: true })
        .populate({
            path: "teacher",
            select: "employeeId",
            populate: {
                path: "user",
                select: "fullName email phone",
            },
        })
        .populate("subject", "name code")
        .populate("schoolClass", "name")
        .populate("section", "name")
        .populate("academicYear", "name isCurrent")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments,
    });

});