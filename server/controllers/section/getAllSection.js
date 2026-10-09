import asyncHandler from "express-async-handler";
import Section from "../../models/Section.js";

export const getAllSections = asyncHandler(async (req, res) => {

    const sections = await Section.find({ isActive: true })
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent",
            },
        })
        .populate("classTeacher", "fullname email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: sections.length,
        data: sections,
    });

});