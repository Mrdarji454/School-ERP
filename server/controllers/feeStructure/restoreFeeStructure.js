import asyncHandler from "express-async-handler";
import FeeStructure from "../../models/FeeStructure.js";

export const restoreFeeStructure = asyncHandler(async (req, res) => {

    const fee = await FeeStructure.findById(req.params.id);

    if (!fee) {
        res.status(404);
        throw new Error("Fee Structure not found");
    }

    fee.isActive = true;
    fee.updatedBy = req.user._id;

    await fee.save();

    res.status(200).json({
        success: true,
        message: "Fee Structure restored successfully",
    });

});