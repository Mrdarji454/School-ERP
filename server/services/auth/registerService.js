import User from "../../models/User.js";
import { fail } from "../../utils/errors.js";
export const registerService = async ({ fullname, email, password, role }) => {
 if (role !== "Admin") fail(400, "Create Teacher and Student accounts through their profile endpoints");
 const user = await User.create({ fullname, email, password, role: "Admin" });
 return { id: user.id, fullname: user.fullname, email: user.email, role: user.role };
};