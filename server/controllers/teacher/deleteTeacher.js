import asyncHandler from "express-async-handler";
import Teacher from "../../models/Teacher.js";
import User from "../../models/User.js";

export const deleteTeacher = asyncHandler(async (req, res) => {

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    teacher.isActive = false;
    teacher.updatedBy = req.user._id;

    await teacher.save();

    await User.findByIdAndUpdate(
        teacher.user,
        {
            isActive: false,
        }
    );

    res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
    });

});