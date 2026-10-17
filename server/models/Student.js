import mongoose from "mongoose";
const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    admissionNo: { type: String, required: true, unique: true, trim: true, immutable: true },
    // Latest-placement projection only. Enrollment intervals govern dated access.
    rollNumber: { type: Number, min: 1 },
    schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass" },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    enrollmentManaged: { type: Boolean, default: false },
    enrollmentRevision: { type: Number, default: 0 },
    enrollmentCutover: Date,
    fatherName: { type: String, default: "" }, motherName: { type: String, default: "" },
    guardianName: { type: String, default: '' }, guardianRelationship: { type: String, default: '' },
    guardianPhone: { type: String, default: '' }, additionalGuardianPhone: { type: String, default: '' },
    admissionDate: Date,
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, default: "" }, address: { type: String, default: "" }, bloodGroup: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// Legacy scoped-roll index removal is an explicit operator step, never syncIndexes().
export default mongoose.model("Student", schema);
