import User from "../../models/User.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const register = async (req, res) => {
    console.log("REGISTER API");
    try {
        const user = await registerService(req.body);

        sendResponse(res, 201, "user created successfully", user);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};