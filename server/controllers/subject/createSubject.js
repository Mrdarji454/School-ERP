import asyncHandler from "express-async-handler";
import Subject from "../../models/Subject.js";
import SchoolClass from "../../models/SchoolClass.js";

export const createSubject = asyncHandler(async (req, res) => {

    const {
        name,
        code,
        schoolClass,
        description,
        isOptional,
    } = req.body;

    const classExists = await SchoolClass.findById(schoolClass);

    if (!classExists) {
        res.status(404);
        throw new Error("School Class not found");
    }

    const existingSubject = await Subject.findOne({
        code: code.toUpperCase(),
        schoolClass,
    });

    if (existingSubject) {
        res.status(400);
        throw new Error("Subject code already exists in this class");
    }

    const subject = await Subject.create({
        name,
        code: code.toUpperCase(),
        schoolClass,
        description,
        isOptional,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Subject created successfully",
        data: subject,
    });

});