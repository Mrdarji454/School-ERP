import { body } from "express-validator";
export const loginValidator = [body("email").isString().bail().trim().isEmail(), body("password").isString().bail().notEmpty()];
export const registerValidator = [...loginValidator, body("fullname").isString().bail().trim().notEmpty(), body("password").isLength({ min: 8 }), body("role").equals("Admin")];