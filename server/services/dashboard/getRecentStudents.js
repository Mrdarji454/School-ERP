import { dashboardData } from "./dashboardData.js";
export const getRecentStudents = async academicYear => (await dashboardData(academicYear)).recentStudents;