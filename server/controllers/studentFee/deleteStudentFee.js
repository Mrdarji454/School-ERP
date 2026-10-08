import asyncHandler from "express-async-handler";
import StudentFee from "../../models/StudentFee.js";

export const deleteStudentFee = asyncHandler(async (req, res) => {

    const fee = await StudentFee.findById(req.params.id);

    if (!fee) {
        res.status(404);
        throw new Error("Student Fee not found");
    }

    fee.isActive = false;
    fee.updatedBy = req.user._id;

    await fee.save();

    res.status(200).json({

        success: true,

        message: "Student Fee deleted successfully",

    });

});