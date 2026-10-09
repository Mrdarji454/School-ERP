import { dashboardData } from "./dashboardData.js";
export const getPendingFees = async academicYear => (await dashboardData(academicYear)).pendingFees;