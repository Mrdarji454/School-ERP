import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const salaryPaymentSchema = new mongoose.Schema(
    {

        teacherSalary: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeacherSalary",
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
                "Bank Transfer",
                "Cheque"
            ],
            required: true
        },

        referenceNumber: {
            type: String,
            default: ""
        },

        remarks: {
            type: String,
            default: ""
        },

        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    },
    {
        timestamps: true
    });

salaryPaymentSchema.add({ receiptNumber: { type: String, immutable: true }, idempotencyKey: String, externalReference: String, isReversed: { type: Boolean, default: false }, reversedAt: Date, reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reversalReason: String });
salaryPaymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
salaryPaymentSchema.index({ externalReference: 1 }, { unique: true, sparse: true });
salaryPaymentSchema.pre("validate", function () { if (this.isNew && !this.receiptNumber) this.receiptNumber = "S-" + randomUUID(); });
salaryPaymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
export default mongoose.model("SalaryPayment", salaryPaymentSchema);