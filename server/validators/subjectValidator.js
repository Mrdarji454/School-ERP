import { body } from "express-validator";

export const createSubjectValidator = [

    body("name")
        .notEmpty()
        .withMessage("Subject name is required"),

    body("code")
        .notEmpty()
        .withMessage("Subject code is required"),

    body("schoolClass")
        .notEmpty()
        .withMessage("School Class is required"),
];