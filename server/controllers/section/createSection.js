import asyncHandler from "express-async-handler";
import Section from "../../models/Section.js";
import SchoolClass from "../../models/SchoolClass.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const createSection = asyncHandler(async (req, res) => {

    const {
        name,
        schoolClass,
        capacity,
        description,
    } = req.body;

    const classExists = await SchoolClass.findById(schoolClass);

    if (!classExists) {
        res.status(404);
        throw new Error("School Class not found");
    }

    const existingSection = await Section.findOne({
        name: name.toUpperCase(),
        schoolClass,
    });

    if (existingSection) {
        res.status(400);
        throw new Error("Section already exists in this class");
    }

    const section = await Section.create({
        name: name.toUpperCase(),
        schoolClass,
        capacity,
        description,
        createdBy: req.user._id,
    });


    sendResponse(res, 201, "Section created successfully", section)
});