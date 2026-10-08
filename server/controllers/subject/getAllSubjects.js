import asyncHandler from "express-async-handler";
import Subject from "../../models/Subject.js";

export const getAllSubjects = asyncHandler(async (req, res) => {

    const subjects = await Subject.find({ isActive: true })
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent"
            }
        })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects
    });

});