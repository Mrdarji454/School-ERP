import { dashboardData } from "./dashboardData.js";
export const getRecentTeachers = async academicYear => (await dashboardData(academicYear)).recentTeachers;