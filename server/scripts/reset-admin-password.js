import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const email = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_RESET_PASSWORD;

try {
    const missing = [
        ["MONGO_URI", process.env.MONGO_URI],
        ["ADMIN_RESET_EMAIL", email],
        ["ADMIN_RESET_PASSWORD", password],
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missing.length) {
        throw new Error(`Missing required .env variable(s): ${missing.join(", ")}`);
    }
    if (password.length < 8) {
        throw new Error("ADMIN_RESET_PASSWORD must be at least 8 characters");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const admin = await User.findOne({ email, role: "Admin" });
    if (!admin) {
        throw new Error(`No administrator found for ${email}`);
    }

    admin.password = password;
    await admin.save();

    console.log(`Password reset successfully for ${email}`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}
