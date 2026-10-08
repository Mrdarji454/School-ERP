import asyncHandler from "express-async-handler";
import FeeStructure from "../../models/FeeStructure.js";

export const getAllFeeStructures = asyncHandler(async (req, res) => {

    const fees = await FeeStructure.find({
        isActive: true,
    })
        .populate("academicYear", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: fees.length,
        data: fees,
    });

});