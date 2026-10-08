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

export default mongoose.model("SalaryStructure", salaryStructureSchema);