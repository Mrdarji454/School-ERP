import Student from "../../models/Student.js";

export const getRecentStudents = async () => {

    return await Student.find({
        isActive: true,
    })
        .populate("user", "fullname email")
        .populate("schoolClass", "name")
        .populate("section", "name")
        .sort({ createdAt: -1 })
        .limit(5);

};