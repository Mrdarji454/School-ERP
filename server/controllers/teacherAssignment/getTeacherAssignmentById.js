import asyncHandler from "express-async-handler";
import TeacherAssignment from "../../models/TeacherAssignment.js";

export const getTeacherAssignmentById = asyncHandler(async (req, res) => {

    const assignment = await TeacherAssignment.findById(req.params.id)
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
        .populate("academicYear", "name isCurrent");

    if (!assignment) {
        res.status(404);
        throw new Error("Teacher Assignment not found");
    }

    res.status(200).json({
        success: true,
        data: assignment,
    });

});