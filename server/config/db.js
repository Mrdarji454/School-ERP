import mongoose from "mongoose";
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI");
        await mongoose.connect(process.env.MONGO_URI);
        // Do not accept requests until uniqueness constraints are ready.
        await Promise.all(Object.values(mongoose.models).map(Model => Model.init()));
        console.log("mongoDb connected successfully");
    } catch (e) {
        console.error("Database connection or index setup failed. Check MONGO_URI and run the read-only data audit before resolving index conflicts.");
        process.exit(1);
    }
};

export default connectDB;
