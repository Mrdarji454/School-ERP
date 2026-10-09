import { dashboardData } from "./dashboardData.js";
export const getUpcomingEvents = async academicYear => (await dashboardData(academicYear)).upcomingEvents;