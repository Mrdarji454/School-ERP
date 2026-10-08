import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
    {
        name: {
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

        capacity: {
            type: Number,
            default: 40,
        },

        classTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            default: null,
        },

        description: {
            type: String,
            default: "",
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

sectionSchema.index(
    { name: 1, schoolClass: 1 },
    { unique: true }
);

export default mongoose.model("Section", sectionSchema);