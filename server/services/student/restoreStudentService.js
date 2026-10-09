import { setStudentActive } from "./studentCore.js";
export const restoreStudentService = id => setStudentActive(id, true);