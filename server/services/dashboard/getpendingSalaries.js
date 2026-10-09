import { dashboardData } from "./dashboardData.js";
export const getPendingSalaries = async academicYear => (await dashboardData(academicYear)).pendingSalaries;