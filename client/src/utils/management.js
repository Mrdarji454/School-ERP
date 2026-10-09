import { management } from "../config/management.js";
export const refId = value => value?._id || value || "";
export const dateInput = value => value ? String(value).slice(0, 10) : "";
export const displayDate = value => value ? new Date(value).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "—";
export function displayTime(value) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
export const recordName = (resource, row) => resource === "teachers" ? row.user?.fullname || "Missing account" : resource === "teacher-assignments" ? `${row.teacher?.user?.fullname || "Missing teacher"} · ${row.subject?.name || "Missing subject"}` : row.name;
export function initialManagementValues(resource, record, selectedYear = "") {
  const values = {};
  for (const field of management[resource].fields) {
    const value = record?.[field.name];
    values[field.name] = field.type === "checkbox" ? Boolean(value) : field.type === "date" ? dateInput(value) : field.type === "select" ? refId(value) : value ?? "";
  }
  if (!record) Object.assign(values, { ...(management[resource].yearScoped ? { academicYear: selectedYear } : {}), ...(resource === "sections" ? { capacity: 40 } : {}), ...(resource === "teachers" ? { experience: 0, employeeType: "Permanent", password: "" } : {}) });
  if (resource === "teachers" && record) for (const key of ["fullname", "email", "phone"]) values[key] = record.user?.[key] || "";
  if (["sections", "subjects"].includes(resource) && record) values.academicYear = refId(record.schoolClass?.academicYear);
  return values;
}
export function managementPayload(resource, values) {
  const fields = management[resource].fields.map(f => f.name).filter(key => !(["sections", "subjects"].includes(resource) && key === "academicYear"));
  const data = Object.fromEntries(fields.map(key => [key, values[key]]));
  if (resource === "sections") data.classTeacher = values.classTeacher || null;
  if (resource === "teachers" && values.password) data.password = values.password;
  return data;
}
export function dependentChanges(name, value) {
  if (name === "academicYear") return { academicYear: value, schoolClass: "", section: "", subject: "" };
  if (name === "schoolClass") return { schoolClass: value, section: "", subject: "" };
  return { [name]: value };
}
export function optionsFor(field, options, values, eligibleOnly = true) {
  if (Array.isArray(field.options)) return field.options.map(value => ({ _id: value, name: value, eligible: true }));
  return (options[field.options] || []).filter(option => {
    if (eligibleOnly && !option.eligible) return false;
    if (field.options === "classes") return String(refId(option.academicYear)) === String(values.academicYear);
    if (["sections", "subjects"].includes(field.options)) return String(refId(option.schoolClass)) === String(values.schoolClass);
    return true;
  });
}
export const optionLabel = option => `${option.name}${option.code ? ` (${option.code})` : ""}${option.employeeId ? ` · ${option.employeeId}` : ""}${option.isCurrent ? " · Current" : ""}${option.eligible === false ? " · Inactive/unavailable" : ""}`;
export function apiError(error) {
  return error.response?.data?.message || error.message || "Unable to complete the request. Please try again.";
}
