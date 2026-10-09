import asyncHandler from "express-async-handler";
import { registerService } from "../../services/auth/registerService.js";
import { sendResponse } from "../../utils/apiResponse.js";
export const register = asyncHandler(async (req, res) => sendResponse(res, 201, "Administrator created", await registerService(req.body)));