import { body } from "express-validator";

export const createSalaryPaymentValidator = [

    body("teacherSalary")
        .notEmpty()
        .withMessage("Teacher Salary is required"),

    body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be greater than 0"),

    body("paymentMethod")
        .isIn([
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque"
        ])
        .withMessage("Invalid payment method"),

];