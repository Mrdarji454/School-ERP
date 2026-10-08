import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },

        schoolClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolClass",
            required: true,
        },

        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",
            required: true,
        },

        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true,
        },

        isClassTeacher: {
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
        remarks: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate assignments
teacherAssignmentSchema.index(
    {
        teacher: 1,
        subject: 1,
        schoolClass: 1,
        section: 1,
        academicYear: 1,
    },

    {
        unique: true,
    }
);

export default mongoose.model(
    "TeacherAssignment",
    teacherAssignmentSchema
);