import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        schoolClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolClass",
            required: true,
        },

        description: {
            type: String,
            default: "",
        },

        isOptional: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

subjectSchema.index(
    {
        code: 1,
        schoolClass: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model("Subject", subjectSchema);