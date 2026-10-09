import { sendResponse } from "../../utils/apiResponse.js";

export const getMe = (req, res) => sendResponse(res, 200, "Profile fetched successfully", req.user);
