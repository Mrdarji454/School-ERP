import asyncHandler from "express-async-handler";
import SalaryStructure from "../../models/SalaryStructure.js";

export const getAllSalaryStructures = asyncHandler(async (req, res) => {

    const salaries = await SalaryStructure.find({
        isActive: true,
    })
        .populate({
            path: "teacher",
            populate: {
                path: "user",
                select: "fullname email",
            },
        });

    res.status(200).json({

        success: true,

        count: salaries.length,

        data: salaries,

    });

});