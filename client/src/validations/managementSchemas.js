import { z } from "zod";
const name = z.string().trim().min(1, "This field is required").max(150, "Use 150 characters or fewer");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Select a valid option");
const description = z.string().max(2000, "Use 2000 characters or fewer");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date").refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Enter a real calendar date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time");
const schemas = {
  "academic-years": z.object({ name, startDate: date, endDate: date }).refine(data => data.startDate < data.endDate, { path: ["endDate"], message: "End date must be after start date" }),
  classes: z.object({ name, academicYear: id, description }),
  sections: z.object({ name, academicYear: id, schoolClass: id, capacity: z.coerce.number().int().min(1, "Capacity must be positive"), classTeacher: id.or(z.literal("")), description }),
  subjects: z.object({ name, code: name.transform(v => v.toUpperCase()), academicYear: id, schoolClass: id, isOptional: z.boolean(), description }),
  periods: z.object({ name, periodNumber: z.coerce.number().int().min(1, "Period number must be positive"), startTime: time, endTime: time, isBreak: z.boolean(), description }).refine(data => data.startTime < data.endTime, { path: ["endTime"], message: "End time must be after start time" }),
  teachers: z.object({ fullname: name, email: z.string().trim().email("Enter a valid email").transform(v => v.toLowerCase()), phone: z.string().trim().regex(/^$|^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"), qualification: name, designation: name, experience: z.coerce.number().min(0, "Experience cannot be negative"), joiningDate: date, department: z.string().max(150), employeeType: z.enum(["Permanent", "Contract", "Guest"]), address: description }),
  "teacher-assignments": z.object({ academicYear: id, schoolClass: id, section: id, subject: id, teacher: id, isClassTeacher: z.boolean(), remarks: description }),
};
export function managementSchema(resource, editing) {
  return resource === "teachers" && !editing ? schemas.teachers.extend({ password: z.string().min(8, "Use at least 8 characters").max(128, "Use 128 characters or fewer") }) : schemas[resource];
}
