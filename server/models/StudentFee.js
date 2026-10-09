import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema(
    {

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        feeStructure: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FeeStructure",
            required: true
        },

        totalAmount: {
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

        paymentStatus: {
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

studentFeeSchema.index({ student: 1, feeStructure: 1 }, { unique: true });
studentFeeSchema.pre("validate", function () { const total = Math.round(this.totalAmount * 100), paid = Math.round(this.paidAmount * 100), remaining = Math.round(this.remainingAmount * 100); if (paid < 0 || total < paid || total - paid !== remaining) this.invalidate("remainingAmount", "Inconsistent financial balance"); this.paymentStatus = remaining === 0 ? "Paid" : paid === 0 ? "Pending" : "Partial"; });
export default mongoose.model("StudentFee", studentFeeSchema);