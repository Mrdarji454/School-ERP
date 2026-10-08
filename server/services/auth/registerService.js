import Student from "../../models/Student.js";
import User from "../../models/User.js";


export const registerService = async (body) => {
    const {
        fullname,
        email,
        password,
        role
    } = body;

    const exists = await User.findOne({ email });

    if (exists) {
        sendResponse(res, 400, "User exists already");
    }
    const user = await User.create({
        fullname,
        email,
        password,
        role,
    });
    return user;
}