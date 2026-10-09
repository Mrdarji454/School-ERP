import asyncHandler from "express-async-handler";
import Section from "../../models/Section.js";
import SchoolClass from "../../models/SchoolClass.js";

export const updateSection = asyncHandler(async (req, res) => {

    const {
        name,
        schoolClass,
        capacity,
        classTeacher,
        description,
    } = req.body;

    const section = await Section.findById(req.params.id);

    if (!section) {
        res.status(404);
        throw new Error("Section not found");
    }

    if (schoolClass) {

        const classExists = await SchoolClass.findById(schoolClass);

        if (!classExists) {
            res.status(404);
            throw new Error("School Class not found");
        }

    }

    const duplicate = await Section.findOne({
        _id: { $ne: req.params.id },
        name: (name || section.name).toUpperCase(),
        schoolClass: schoolClass || section.schoolClass,
    });

    if (duplicate) {
        res.status(400);
        throw new Error("Section already exists in this class");
    }

    section.name = name ? name.toUpperCase() : section.name;
    section.schoolClass = schoolClass ?? section.schoolClass;
    section.capacity = capacity ?? section.capacity;
    if (classTeacher !== undefined) section.classTeacher = classTeacher;
    section.description = description ?? section.description;
    section.updatedBy = req.user._id;

    await section.save();

    const updatedSection = await Section.findById(section._id)
        .populate({
            path: "schoolClass",
            select: "name academicYear",
            populate: {
                path: "academicYear",
                select: "name isCurrent",
            },
        })
        .populate("classTeacher", "fullname email");

    res.status(200).json({
        success: true,
        message: "Section updated successfully",
        data: updatedSection,
    });

});
