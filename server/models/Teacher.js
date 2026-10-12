import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        employeeId: {
            immutable: true,
            type: String,
            required: true,
            unique: true,
        },

        qualification: {
            type: String,
            required: true,
            trim: true,
        },

        experience: {
            type: Number,
            default: 0,
        },

        designation: {
            type: String,
            required: true,
            trim: true,
        },

        joiningDate: {
            type: Date,
            required: true,
        },

        salary: {
            type: Number,
            default: 0,
        },

        address: {
            type: String,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        employeeType: {
            type: String,
            enum: ["Permanent", "Contract", "Guest"],
            default: "Permanent",
        },

        department: {
            type: String,
            default: "",
        },

        photo: {
            type: String,
            default: "",
        },
        dob: Date,
        emergencyContact: { type: String, default: '' },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Teacher", teacherSchema);
