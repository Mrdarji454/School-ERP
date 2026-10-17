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

teacherSalarySchema.add({ basicSalary: Number, allowance: Number, description: String, snapshotVersion: Number });
teacherSalarySchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true });
teacherSalarySchema.pre("validate", function () { const total = Math.round(this.netSalary * 100), paid = Math.round(this.paidAmount * 100), remaining = Math.round(this.remainingAmount * 100); if (paid < 0 || total < paid || total - paid !== remaining) this.invalidate("remainingAmount", "Inconsistent financial balance"); this.status = remaining === 0 ? "Paid" : paid === 0 ? "Pending" : "Partial"; });
export default mongoose.model("TeacherSalary", teacherSalarySchema);