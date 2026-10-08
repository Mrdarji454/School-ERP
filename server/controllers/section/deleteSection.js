import asyncHandler from "express-async-handler";
import Section from "../../models/Section.js";

export const deleteSection = asyncHandler(async (req, res) => {

    const section = await Section.findById(req.params.id);

    if (!section) {
        res.status(404);
        throw new Error("Section not found");
    }

    section.isActive = false;
    section.updatedBy = req.user._id;

    await section.save();

    res.status(200).json({
        success: true,
        message: "Section deleted successfully",
    });

});