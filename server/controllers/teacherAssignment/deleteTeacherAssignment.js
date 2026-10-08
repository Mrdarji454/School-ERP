import asyncHandler from "express-async-handler";
import TeacherAssignment from "../../models/TeacherAssignment.js";

export const deleteTeacherAssignment = asyncHandler(async (req, res) => {

    const assignment = await TeacherAssignment.findById(req.params.id);

    if (!assignment) {
        res.status(404);
        throw new Error("Teacher Assignment not found");
    }

    assignment.isActive = false;
    assignment.updatedBy = req.user._id;

    await assignment.save();

    res.status(200).json({
        success: true,
        message: "Teacher Assignment deleted successfully",
    });

});