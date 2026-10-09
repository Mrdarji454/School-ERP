import { duplicateMessage } from "../utils/duplicateMessage.js";
export const notFound = (req, res, next) => next(Object.assign(new Error("Route not found"), { status: 404 }));
export const errotHandler = (err, req, res, next) => {
 if (res.headersSent) return next(err);
 const status = err.code === 11000 ? 409 : ["ValidationError", "CastError", "MulterError"].includes(err.name) ? 400 : err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
 res.status(status).json({ success: false, message: err.code === 11000 ? duplicateMessage(err) : status === 500 ? "Internal server error" : err.message });
};
