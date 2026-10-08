import mongoose from "mongoose";

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

export default mongoose.model("SalaryPayment", salaryPaymentSchema);