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

feeStructureSchema.pre("validate", function () { if (this.feeType === "Semester" && !this.semester) this.invalidate("semester", "Semester is required"); if (this.feeType === "Annual") this.semester = null; });
feeStructureSchema.index({ academicYear: 1, feeType: 1, semester: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
feeStructureSchema.pre("validate", function () { for (const key of ["amount","lateFee"]) { const n = this[key] * 100; if (!Number.isSafeInteger(Math.round(n)) || Math.abs(n - Math.round(n)) > 0.00001 || this[key] < 0) this.invalidate(key, "Amounts must be nonnegative with at most two decimal places"); } });
export default mongoose.model("FeeStructure", feeStructureSchema);