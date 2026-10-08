import asyncHandler from "express-async-handler";
import SalaryStructure from "../../models/SalaryStructure.js";

export const updateSalaryStructure = asyncHandler(async (req, res) => {

    const salary = await SalaryStructure.findById(req.params.id);

    if (!salary) {
        res.status(404);
        throw new Error("Salary structure not found");
    }

    Object.assign(salary, req.body);

    salary.updatedBy = req.user._id;

    await salary.save();

    res.status(200).json({

        success: true,

        message: "Salary structure updated successfully",

        data: salary,

    });

});