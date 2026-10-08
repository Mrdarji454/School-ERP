import asyncHandler from "express-async-handler";
import FeeStructure from "../../models/FeeStructure.js";

export const getFeeStructureById = asyncHandler(async (req, res) => {

    const fee = await FeeStructure.findById(req.params.id)
        .populate("academicYear", "name");

    if (!fee) {
        res.status(404);
        throw new Error("Fee Structure not found");
    }

    res.status(200).json({
        success: true,
        data: fee,
    });

});