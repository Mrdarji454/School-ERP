import mongoose from "mongoose";
const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    admissionNo: { type: String, required: true, unique: true, trim: true },
    rollNumber: { type: Number, required: true, min: 1 },
    schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    fatherName: { type: String, default: "" }, motherName: { type: String, default: "" },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, default: "" }, address: { type: String, default: "" }, bloodGroup: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model("Student", schema);
