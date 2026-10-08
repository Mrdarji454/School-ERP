import User from "../../models/User.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const getMe = async (req, res) => {

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
        return sendResponse(res, 404, "User not found");
    }

    sendResponse(res, 200, "Profile fetched successfully", user);

};