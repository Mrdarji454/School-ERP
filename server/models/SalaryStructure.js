import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        basicSalary: {
            type: Number,
            required: true
        },

        allowance: {
            type: Number,
            default: 0
        },

        deduction: {
            type: Number,
            default: 0
        },

        effectiveFrom: {
            type: Date,
            required: true
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

salaryStructureSchema.pre("validate", function () { if (this.basicSalary < 0 || this.allowance < 0 || this.deduction < 0 || this.deduction > this.basicSalary + this.allowance) this.invalidate("deduction", "Invalid salary amounts"); });
salaryStructureSchema.index({ teacher: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
salaryStructureSchema.pre("validate", function () { for (const key of ["basicSalary","allowance","deduction"]) { const n = this[key] * 100; if (!Number.isSafeInteger(Math.round(n)) || Math.abs(n - Math.round(n)) > 0.00001 || this[key] < 0) this.invalidate(key, "Amounts must be nonnegative with at most two decimal places"); } });
export default mongoose.model("SalaryStructure", salaryStructureSchema);