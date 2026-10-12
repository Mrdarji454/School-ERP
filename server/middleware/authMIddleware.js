import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. No token provided."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select("+tokenVersion");

        if (!req.user || !req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }
        const Profile = req.user.role === "Student" ? Student : req.user.role === "Teacher" ? Teacher : null;
        if ((decoded.tokenVersion || 0) !== (req.user.tokenVersion || 0)) return res.status(401).json({ success: false, message: 'Session expired. Log in again.' });
        const onboardingAllowed = (req.baseUrl === '/api/auth' && ((req.path === '/me' && req.method === 'GET') || (req.path === '/password' && req.method === 'POST')));
        if (req.user.mustChangePassword && !onboardingAllowed) return res.status(403).json({ success: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Change your initial password before continuing.' });
        if (Profile && !await Profile.exists({ user: req.user._id, isActive: true })) return res.status(401).json({ success: false, message: "Inactive or missing profile" });
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "invalid or expired token."
        });
    }
};

export default protect;
