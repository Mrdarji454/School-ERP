import asyncHandler from "express-async-handler";
import SchoolClass from "../../models/SchoolClass.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const deleteClass = asyncHandler(async (req, res) => {
    const schoolClass = await SchoolClass.findById(req.params.id);

    if (!schoolClass) {
        res.status(404);
        throw new Error("Class not found");
    }

    schoolClass.isActive = false;

    await schoolClass.save();

    res.status(200).json({
        success: true,
        message: "Class deleted successfully",
    });
    sendResponse(res, 200, "Class deleted successfully", schoolClass);
});