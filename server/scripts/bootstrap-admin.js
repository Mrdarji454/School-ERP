import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
try {
 const { MONGO_URI, INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;
 if (!MONGO_URI || !INITIAL_ADMIN_NAME || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD || INITIAL_ADMIN_PASSWORD.length < 8) throw new Error("Set MONGO_URI and INITIAL_ADMIN_NAME/EMAIL/PASSWORD (8+ characters)");
 await mongoose.connect(MONGO_URI); await User.init();
 if (await User.exists({ role: "Admin" })) throw new Error("An administrator already exists");
 await User.create({ _id: "000000000000000000000001", fullname: INITIAL_ADMIN_NAME, email: INITIAL_ADMIN_EMAIL, password: INITIAL_ADMIN_PASSWORD, role: "Admin" });
 console.log("Initial administrator created");
} catch (error) { console.error(error.code === 11000 ? "Administrator already created" : error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }