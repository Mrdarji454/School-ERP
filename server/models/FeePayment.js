import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
    {

        studentFee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentFee",
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        paymentDate: {
            type: Date,
            default: Date.now
        },

        paymentMethod: {
            type: String,
            enum: [
                "Cash",
                "UPI",
                "Card",
                "Bank Transfer",
                "Cheque"
            ],
            required: true
        },

        transactionId: {
            type: String,
            default: ""
        },

        remarks: {
            type: String,
            default: ""
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    },
    {
        timestamps: true
    });

export default mongoose.model("FeePayment", feePaymentSchema);