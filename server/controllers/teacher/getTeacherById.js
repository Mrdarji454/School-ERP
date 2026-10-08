import asyncHandler from "express-async-handler";
import Teacher from "../../models/Teacher.js";

export const getTeacherById = asyncHandler(async (req, res) => {

    const teacher = await Teacher.findById(req.params.id)
        .populate("user", "fullName email phone profileImage");

    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    res.status(200).json({
        success: true,
        data: teacher,
    });

});