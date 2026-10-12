import mongoose from "mongoose";
const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    admissionNo: { type: String, required: true, unique: true, trim: true, immutable: true },
    rollNumber: { type: Number, required: true, min: 1 },
    schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    fatherName: { type: String, default: "" }, motherName: { type: String, default: "" },
    guardianName: { type: String, default: '' }, guardianRelationship: { type: String, default: '' },
    guardianPhone: { type: String, default: '' }, additionalGuardianPhone: { type: String, default: '' },
    admissionDate: Date,
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, default: "" }, address: { type: String, default: "" }, bloodGroup: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ schoolClass: 1, section: 1, rollNumber: 1 }, { unique: true });
export default mongoose.model("Student", schema);
