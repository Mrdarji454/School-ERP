import User from "../../models/User.js";
import generateToken from "../../utils/generateToken.js";

export const loginSrvice = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const token = generateToken(user._id, user.role);
    return { token, user };
}