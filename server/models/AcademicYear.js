import mongoose, { Types } from "mongoose";

const AcademicYearSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        isCurrent: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    }, {
    timestamps: true,
}
);
const AcademicYear = mongoose.model("AcademicYear", AcademicYearSchema);
export default AcademicYear;