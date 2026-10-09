import asyncHandler from "express-async-handler";
import Section from "../../models/Section.js";

export const getSectionById = asyncHandler(async (req, res) => {

    const section = await Section.findById(req.params.id)
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent",
            },
        })
        .populate("classTeacher", "fullname email");

    if (!section) {
        res.status(404);
        throw new Error("Section not found");
    }

    res.status(200).json({
        success: true,
        data: section,
    });

});