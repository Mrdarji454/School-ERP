import asyncHandler from "express-async-handler";
import Subject from "../../models/Subject.js";

export const deleteSubject = asyncHandler(async (req, res) => {

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error("Subject not found");
    }

    subject.isActive = false;
    subject.updatedBy = req.user._id;

    await subject.save();

    res.status(200).json({
        success: true,
        message: "Subject deleted successfully"
    });

});