import { body } from "express-validator";

const createStudentValidator = [
    body("fullname").trim().notEmpty().withMessage("Full name is required"),

    body("email").isEmail().withMessage("invalid Email"),
    body("password").isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
    body("rollNumber").isNumeric().withMessage("Roll Number must be numeric"),
    body("schoolClass").isMongoId().withMessage("Invalid School Class ID"),
    body("section").isMongoId().withMessage("Invalid Section ID"),
];
export default createStudentValidator;