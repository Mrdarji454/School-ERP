import { body } from "express-validator";

export const createClassValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Class name is required"),

    body("academicYear")
        .isMongoId()
        .withMessage("Invalid Academic Year ID"),

];