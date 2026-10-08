import asyncHandler from "express-async-handler";
import SalaryStructure from "../../models/SalaryStructure.js";

export const getSalaryStructureById = asyncHandler(async (req, res) => {

    const salary = await SalaryStructure.findById(req.params.id)
        .populate({
            path: "teacher",
            populate: {
                path: "user",
                select: "fullname email",
            },
        });

    if (!salary) {
        res.status(404);
        throw new Error("Salary structure not found");
    }

    res.status(200).json({

        success: true,

        data: salary,

    });

});