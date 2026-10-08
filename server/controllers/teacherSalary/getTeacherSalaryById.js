import asyncHandler from "express-async-handler";
import TeacherSalary from "../../models/TeacherSalary.js";

export const getTeacherSalaryById = asyncHandler(async (req, res) => {

    const salary = await TeacherSalary.findById(req.params.id)
        .populate({
            path: "teacher",
            populate: {
                path: "user",
                select: "fullname email",
            },
        })
        .populate("salaryStructure");

    if (!salary) {
        res.status(404);
        throw new Error("Salary record not found");
    }

    res.status(200).json({
        success: true,
        data: salary,
    });

});