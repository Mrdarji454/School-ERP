import mongoose from "mongoose";

const teacherSalarySchema = new mongoose.Schema(
    {

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        salaryStructure: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalaryStructure",
            required: true
        },

        month: {
            type: Number,
            required: true
        },

        year: {
            type: Number,
            required: true
        },

        grossSalary: {
            type: Number,
            required: true
        },

        deduction: {
            type: Number,
            default: 0
        },

        netSalary: {
            type: Number,
            required: true
        },

        paidAmount: {
            type: Number,
            default: 0
        },

        remainingAmount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Partial",
                "Paid"
            ],
            default: "Pending"
        },

        isActive: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true
    });

export default mongoose.model("TeacherSalary", teacherSalarySchema);