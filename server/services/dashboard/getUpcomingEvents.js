import AcademicCalendar from "../../models/AcademicCalendar.js";

export const getUpcomingEvents = async () => {

    const today = new Date();

    return await AcademicCalendar.find({
        isActive: true,
        startDate: { $gte: today },
    })
        .sort({ startDate: 1 })
        .limit(5)
        .select("title type startDate endDate");
};