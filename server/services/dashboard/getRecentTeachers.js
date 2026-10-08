import Teacher from "../../models/Teacher.js";

export const getRecentTeachers = async () => {

    return await Teacher.find({
        isActive: true,
    })
        .populate("user", "fullname email")
        .sort({ createdAt: -1 })
        .limit(5);

};