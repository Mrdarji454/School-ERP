import asyncHandler from "express-async-handler";
import Subject from "../../models/Subject.js";
import SchoolClass from "../../models/SchoolClass.js";

export const updateSubject = asyncHandler(async (req, res) => {

    const {
        name,
        code,
        schoolClass,
        description,
        isOptional
    } = req.body;

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error("Subject not found");
    }

    if (schoolClass) {

        const classExists = await SchoolClass.findById(schoolClass);

        if (!classExists) {
            res.status(404);
            throw new Error("School Class not found");
        }

    }

    const duplicate = await Subject.findOne({
        _id: { $ne: req.params.id },
        code: (code || subject.code).toUpperCase(),
        schoolClass: schoolClass || subject.schoolClass
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Subject code already exists in this class");
    }

    subject.name = name ?? subject.name;
    subject.code = code ? code.toUpperCase() : subject.code;
    subject.schoolClass = schoolClass ?? subject.schoolClass;
    subject.description = description ?? subject.description;
    subject.isOptional = isOptional ?? subject.isOptional;
    subject.updatedBy = req.user._id;

    await subject.save();

    const updatedSubject = await Subject.findById(subject._id)
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent"
            }
        });

    res.status(200).json({
        success: true,
        message: "Subject updated successfully",
        data: updatedSubject
    });

});