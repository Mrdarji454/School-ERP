import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
    {
        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true,
        },

        teacherAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeacherAssignment",
            required: true,
        },

        day: {
            type: String,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            required: true,
        },

        period: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Period",
            required: true,
        },

        roomNumber: {
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

// Prevent duplicate period for same class/section/day
timetableSchema.index(
    {
        teacherAssignment: 1,
        day: 1,
        period: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model("Timetable", timetableSchema);