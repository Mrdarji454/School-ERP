import asyncHandler from "express-async-handler";
import TeacherSalary from "../../models/TeacherSalary.js";

export const getAllTeacherSalaries = asyncHandler(async (req, res) => {

    const salaries = await TeacherSalary.find({
        isActive: true,
    })
        .populate({
            path: "teacher",
            populate: {
                path: "user",
                select: "fullname email",
            },
        })
        .sort({
            year: -1,
            month: -1,
        });

    res.status(200).json({

        success: true,

        count: salaries.length,

        data: salaries,

    });

});