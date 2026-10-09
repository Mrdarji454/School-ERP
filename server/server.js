import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
await connectDB();
app.listen(process.env.PORT || 5000, () => console.log("School API listening"));