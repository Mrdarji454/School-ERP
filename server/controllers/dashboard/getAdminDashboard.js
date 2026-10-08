import asyncHandler from "express-async-handler";

import { getStatistics } from "../../services/dashboard/getStatistics.js";
import { getAttendanceSummary } from "../../services/dashboard/getAttendanceSummary.js";
import { getTodayTimetable } from "../../services/dashboard/getTodayTimetable.js";
import { getUpcomingEvents } from "../../services/dashboard/getUpcomingEvents.js";
import { getRecentStudents } from "../../services/dashboard/getRecentStudents.js";
import { getRecentTeachers } from "../../services/dashboard/getRecentTeachers.js";
import { getPendingFees } from "../../services/dashboard/getPendingFees.js";
import { getPendingSalaries } from "../../services/dashboard/getPendingSalaries.js";
import { getNotifications } from "../../services/dashboard/getNotifications.js";

export const getAdminDashboard = asyncHandler(async (req, res) => {

    const [
        statistics,
        attendance,
        todayTimetable,
        upcomingEvents,
        recentStudents,
        recentTeachers,
        pendingFees,
        pendingSalaries,
        notifications,
    ] = await Promise.all([
        getStatistics(),
        getAttendanceSummary(),
        getTodayTimetable(),
        getUpcomingEvents(),
        getRecentStudents(),
        getRecentTeachers(),
        getPendingFees(),
        getPendingSalaries(),
        getNotifications(),
    ]);

    res.status(200).json({
        success: true,
        data: {
            statistics,
            attendance,
            todayTimetable,
            upcomingEvents,
            recentStudents,
            recentTeachers,
            pendingFees,
            pendingSalaries,
            notifications,
        },
    });

});