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

export default mongoose.model("StudentFee", studentFeeSchema);