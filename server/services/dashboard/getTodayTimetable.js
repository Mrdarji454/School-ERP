import Timetable from "../../models/Timetable.js";

export const getTodayTimetable = async () => {

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const today = days[new Date().getDay()];

    return await Timetable.find({
        day: today,
        isActive: true,
    })
        .populate("period")
        .populate({
            path: "teacherAssignment",
            populate: [
                {
                    path: "teacher",
                    populate: {
                        path: "user",
                        select: "fullname",
                    },
                },
                {
                    path: "subject",
                    select: "name",
                },
                {
                    path: "schoolClass",
                    select: "name",
                },
                {
                    path: "section",
                    select: "name",
                },
            ],
        })
        .sort({
            "period.periodNumber": 1,
        });

};