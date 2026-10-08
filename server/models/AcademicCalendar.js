import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
    {
        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        type: {
            type: String,
            enum: [
                "Holiday",
                "Working Day",
                "Half Day",
                "Vacation",
                "Event",
                "Exam"
            ],
            required: true,
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
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

export default mongoose.model(
    "AcademicCalendar",
    academicCalendarSchema
);