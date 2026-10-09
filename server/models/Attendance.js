import mongoose from "mongoose";

const attendanceStudentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Present",
                "Absent",
                "Late",
                "Half Day",
                "Leave",
            ],
            required: true,
        },

        remark: {
            type: String,
            default: "",
        },

        markedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

const attendanceSchema = new mongoose.Schema(
    {
        teacherAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeacherAssignment",
            required: true,
        },

        attendanceDate: {
            type: Date,
            required: true,
        },
        period: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Period",
            required: true,
        },


        students: [attendanceStudentSchema],
        audit: [{ actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, action: { type: String, enum: ['lock', 'unlock', 'deactivate', 'correction'] }, reason: String, at: { type: Date, default: Date.now } }],

        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        isLocked: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

attendanceSchema.index(
    {
        teacherAssignment: 1,
        attendanceDate: 1,
        period: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model("Attendance", attendanceSchema);
