import asyncHandler from "express-async-handler";
import Period from "../../models/Period.js";
import Timetable from "../../models/TimeTable.js";
import { fail } from "../../utils/errors.js";
export const updatePeriod = asyncHandler(async (req, res) => {
 const period = await Period.findById(req.params.id).select("_id __v startTime endTime isBreak");
 if (!period) fail(404, "Period not found");
 if (["startTime", "endTime", "isBreak"].some(key => req.body[key] !== undefined && req.body[key] !== period[key]) && await Timetable.exists({ period: period._id })) {
  fail(409, "Create a new period to change the timing of a scheduled period");
 }
 const updates = { updatedBy: req.user._id };
 for (const key of ["name", "periodNumber", "startTime", "endTime", "isBreak", "description"]) {
  if (req.body[key] !== undefined) updates[key] = req.body[key];
 }
 const data = await Period.findOneAndUpdate(
  { _id: period._id, __v: period.__v },
  { $set: updates, $inc: { __v: 1 } },
  { new: true, runValidators: true }
 );
 if (!data) fail(409, "Period changed while being edited; reload and try again");
 res.json({ success: true, data });
});