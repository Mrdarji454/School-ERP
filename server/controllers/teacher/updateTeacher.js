import asyncHandler from "express-async-handler";
import Teacher from "../../models/Teacher.js";
import User from "../../models/User.js";

export const updateTeacher = asyncHandler(async (req, res) => {

    const {
        fullName,
        email,
        phone,
        qualification,
        experience,
        designation,
        joiningDate,
        salary,
        address,
    } = req.body;

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    const user = await User.findById(teacher.user);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Email duplicate check
    if (email && email !== user.email) {

        const existingUser = await User.findOne({
            email,
            _id: { $ne: user._id },
        });

        if (existingUser) {
            res.status(400);
            throw new Error("Email already exists");
        }

        user.email = email;
    }

    user.fullName = fullName ?? user.fullName;
    user.phone = phone ?? user.phone;

    await user.save();

    teacher.qualification = qualification ?? teacher.qualification;
    teacher.experience = experience ?? teacher.experience;
    teacher.designation = designation ?? teacher.designation;
    teacher.joiningDate = joiningDate ?? teacher.joiningDate;
    teacher.salary = salary ?? teacher.salary;
    teacher.address = address ?? teacher.address;
    teacher.updatedBy = req.user._id;

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
        .populate("user", "fullName email phone profileImage");

    res.status(200).json({
        success: true,
        message: "Teacher updated successfully",
        data: updatedTeacher,
    });

});