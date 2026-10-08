import { body } from "express-validator";

export const createFeeStructureValidator = [

    body("academicYear")
        .notEmpty()
        .withMessage("Academic Year is required"),

    body("feeType")
        .isIn(["Annual", "Semester"])
        .withMessage("Fee Type must be Annual or Semester"),

    body("amount")
        .isFloat({ min: 1 })
        .withMessage("Amount must be greater than 0"),

    body("dueDate")
        .isISO8601()
        .withMessage("Valid due date is required"),

    body("lateFee")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Late fee cannot be negative"),

    body("semester")
        .optional()
        .isInt({ min: 1, max: 8 })
        .withMessage("Semester must be between 1 and 8"),
];