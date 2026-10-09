import Student from "../../models/Student.js";
import Teacher from "../../models/Teacher.js";
import User from "../../models/User.js";
import generateToken from "../../utils/generateToken.js";

export const loginSrvice = async (email, password) => {
    const user = await User.findOne({ email: email.trim().toLowerCase(), isActive: true }).select("+password");

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const Profile = user.role === "Student" ? Student : user.role === "Teacher" ? Teacher : null;
    if (Profile && !await Profile.exists({ user: user._id, isActive: true })) throw new Error("Invalid credentials");
    const token = generateToken(user._id, user.role);
    return { token, user };
}
