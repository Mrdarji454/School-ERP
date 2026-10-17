import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

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

feePaymentSchema.add({ receiptNumber: { type: String, immutable: true }, idempotencyKey: String, externalReference: String, isReversed: { type: Boolean, default: false }, reversedAt: Date, reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reversalReason: String });
feePaymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
feePaymentSchema.index({ externalReference: 1 }, { unique: true, sparse: true });
feePaymentSchema.pre("validate", function () { if (this.isNew && !this.receiptNumber) this.receiptNumber = "F-" + randomUUID(); });
feePaymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
export default mongoose.model("FeePayment", feePaymentSchema);