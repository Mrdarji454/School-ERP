import asyncHandler from "express-async-handler";
import Teacher from "../../models/Teacher.js";
import User from "../../models/User.js";

export const restoreTeacher = asyncHandler(async (req, res) => {

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    teacher.isActive = true;
    teacher.updatedBy = req.user._id;

    await teacher.save();

    await User.findByIdAndUpdate(
        teacher.user,
        {
            isActive: true,
        }
    );

    res.status(200).json({
        success: true,
        message: "Teacher restored successfully",
    });

});