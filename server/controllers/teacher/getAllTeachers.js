import asyncHandler from "express-async-handler";
import Teacher from "../../models/Teacher.js";

export const getAllTeachers = asyncHandler(async (req, res) => {

    const teachers = await Teacher.find({ isActive: true })
        .populate("user", "fullname email phone profileImage")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: teachers.length,
        data: teachers,
    });

});