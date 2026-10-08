import asyncHandler from "express-async-handler";
import Subject from "../../models/Subject.js";

export const getSubjectById = asyncHandler(async (req, res) => {

    const subject = await Subject.findById(req.params.id)
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent"
            }
        });

    if (!subject) {
        res.status(404);
        throw new Error("Subject not found");
    }

    res.status(200).json({
        success: true,
        data: subject
    });

});