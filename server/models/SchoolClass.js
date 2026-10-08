import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true,
        },

        description: {
            type: String,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate class names within the same academic year
classSchema.index(
    { name: 1, academicYear: 1 },
    { unique: true }
);
const SchoolClass = mongoose.model("SchoolClass", classSchema);

export default SchoolClass;