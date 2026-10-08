import express from "express";
import { login } from "../controllers/auth/login.js";
import { logout } from "../controllers/auth/logout.js";
import { register } from "../controllers/auth/register.js";
import { getMe } from "../controllers/auth/me.js";
import { protect } from "../middleware/authMIddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);


export default router;