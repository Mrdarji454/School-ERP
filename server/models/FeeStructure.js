import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
    {
        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true
        },

        feeType: {
            type: String,
            enum: ["Annual", "Semester"],
            required: true
        },

        semester: {
            type: Number,
            min: 1,
            max: 8,
            default: null
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        dueDate: {
            type: Date,
            required: true
        },

        lateFee: {
            type: Number,
            default: 0
        },

        description: {
            type: String,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    },
    {
        timestamps: true
    });

export default mongoose.model("FeeStructure", feeStructureSchema);