import { body } from "express-validator";

export const createStudentFeeValidator = [

    body("student")
        .notEmpty()
        .withMessage("Student is required"),

    body("feeStructure")
        .notEmpty()
        .withMessage("Fee Structure is required"),

];