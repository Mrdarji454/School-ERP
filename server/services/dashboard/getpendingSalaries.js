import TeacherSalary from "../../models/TeacherSalary.js";

export const getPendingSalaries = async () => {

    return await TeacherSalary.find({
        status: {
            $ne: "Paid",
        },
        isActive: true,
    })
        .populate({
            path: "teacher",
            populate: {
                path: "user",
                select: "fullname",
            },
        })
        .limit(5);

};