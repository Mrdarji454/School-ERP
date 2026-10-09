import { setStudentActive } from "./studentCore.js";
export const deleteStudentService = id => setStudentActive(id, false);