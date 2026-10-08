import { body } from "express-validator";

export const createSalaryStructureValidator = [

    body("teacher")
        .notEmpty()
        .withMessage("Teacher is required"),

    body("basicSalary")
        .isFloat({ min: 1 })
        .withMessage("Basic salary is required"),

    body("allowance")
        .optional()
        .isFloat({ min: 0 }),

    body("deduction")
        .optional()
        .isFloat({ min: 0 }),

    body("effectiveFrom")
        .isISO8601()
        .withMessage("Effective date is required"),

];