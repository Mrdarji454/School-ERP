import asyncHandler from "express-async-handler";
import TeacherSalary from "../../models/TeacherSalary.js";

export const deleteTeacherSalary = asyncHandler(async (req, res) => {

    const salary = await TeacherSalary.findById(req.params.id);

    if (!salary) {
        res.status(404);
        throw new Error("Salary record not found");
    }

    salary.isActive = false;

    await salary.save();

    res.status(200).json({
        success: true,
        message: "Salary record deleted successfully",
    });

});