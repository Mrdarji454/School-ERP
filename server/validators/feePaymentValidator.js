import { body } from "express-validator";

export const createFeePaymentValidator = [

    body("studentFee")
        .notEmpty()
        .withMessage("Student Fee is required"),

    body("amount")
        .isFloat({ min: 1 })
        .withMessage("Amount must be greater than 0"),

    body("paymentMethod")
        .isIn([
            "Cash",
            "UPI",
            "Card",
            "Bank Transfer",
            "Cheque",
        ])
        .withMessage("Invalid payment method"),

];