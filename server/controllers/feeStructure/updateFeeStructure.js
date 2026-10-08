import asyncHandler from "express-async-handler";
import FeeStructure from "../../models/FeeStructure.js";

export const updateFeeStructure = asyncHandler(async (req, res) => {

    const fee = await FeeStructure.findById(req.params.id);

    if (!fee) {
        res.status(404);
        throw new Error("Fee Structure not found");
    }

    Object.assign(fee, req.body);

    fee.updatedBy = req.user._id;

    await fee.save();

    res.status(200).json({
        success: true,
        message: "Fee Structure updated successfully",
        data: fee,
    });

});