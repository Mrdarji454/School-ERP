import { loginSrvice } from "../../services/auth/loginService.js";
import { sendResponse } from "../../utils/apiResponse.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginSrvice(email, password);

        sendResponse(res, 200, "login successfully", {
            token: result.token,
            user: {
                id: result.user._id,
                fullname: result.user.fullname,
                email: result.user.email,
                role: result.user.role,
            },
        });
    } catch (err) {
        sendResponse(res, 401, "Invalid credentials or inactive account");
    }
};