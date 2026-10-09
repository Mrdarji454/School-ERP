import { dashboardData } from "./dashboardData.js";
export const getAttendanceSummary = async academicYear => (await dashboardData(academicYear)).attendance;