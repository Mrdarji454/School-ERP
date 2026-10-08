import Student from "../../models/Student.js";
import User from "../../models/User.js";

export const getAllStudentService = async (query) => {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
        search,
        schoolClass,
        section,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const filter = {};

    if (status !== undefined && status !== "") {
        filter.isActive = status === "true";
    }

    if (schoolClass) {
        filter.schoolClass = schoolClass;
    }

    if (section) {
        filter.section = section;
    }

    if (search) {

        const users = await User.find({
            fullname: {
                $regex: search,
                $options: "i",
            },
        }).select("_id");

        filter.user = {
            $in: users.map(user => user._id),
        };
    }

    const totalStudents = await Student.countDocuments(filter);

    const students = await Student.find(filter)
        .populate("user", "-password")
        .populate("schoolClass")
        .populate("section")
        .sort({
            [sortBy]: sortOrder === "asc" ? 1 : -1,
        })
        .skip(skip)
        .limit(limit);

    return {
        students,
        pagination: {
            page,
            limit,
            totalStudents,
            totalPages: Math.ceil(totalStudents / limit),
        },
    };
};