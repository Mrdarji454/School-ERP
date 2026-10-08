import asyncHandler from "express-async-handler";

import User from "../../models/User.js";
import Teacher from "../../models/Teacher.js";

export const createTeacher = asyncHandler(async (req, res) => {

    const {
        fullname,
        email,
        password,
        qualification,
        experience,
        designation,
        joiningDate,
        salary,
        address,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        res.status(400);
        throw new Error("Email already exists");
    }

    const teacherCount = await Teacher.countDocuments();

    const employeeId = `TCH${String(teacherCount + 1).padStart(4, "0")}`;



    const user = await User.create({
        fullname,
        email,
        password, // pre("save") will hash it automatically
        role: "Teacher",
    });

    const teacher = await Teacher.create({
        user: user._id,
        employeeId,
        qualification,
        experience,
        designation,
        joiningDate,
        salary,
        address,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Teacher created successfully",
        data: {
            teacher,
            user,
        },
    });

});