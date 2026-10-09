import { fail } from "./errors.js";
export function schoolDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(400, "Use a school calendar date in YYYY-MM-DD format");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail(400, "Invalid calendar date");
  return date;
}
export function schoolToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.SCHOOL_TIMEZONE || "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = key => parts.find(p => p.type === key).value;
  return schoolDate(`${get("year")}-${get("month")}-${get("day")}`);
}
