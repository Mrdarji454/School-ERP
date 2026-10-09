import { dashboardData } from "./dashboardData.js";
export const getStatistics = async academicYear => (await dashboardData(academicYear)).statistics;