import { dashboardData } from "./dashboardData.js";
export const getTodayTimetable = async academicYear => (await dashboardData(academicYear)).todayTimetable;