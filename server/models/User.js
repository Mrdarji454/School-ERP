import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        fullname: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, },
        password: { type: String, required: true, minlength: 8, select: false },
        role: { type: String, enum: ["Admin", "Teacher", "Student"], },
        profileImage: { type: String, default: "", },
        phone: { type: String, default: "", },
        isActive: { type: Boolean, default: true, },
        lastLogin: { type: Date, },
    }, {
    timestamps: true,
}
);


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
// userSchema.index({ fullname: "text", email: "text" });
userSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; return ret; } });
const User = mongoose.model("User", userSchema);
export default User;
