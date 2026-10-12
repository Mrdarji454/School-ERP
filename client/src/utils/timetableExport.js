import { days, idOf } from "./workflow.js";

const cell = (value) => {
  let text = String(value ?? "");
  // Neutralize spreadsheet formulas in user-entered labels.
  if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export function timetableCsv(records, selection) {
  if (!selection.academicYear || !selection.schoolClass || !selection.section)
    throw new Error("Select an academic year, class and section to export.");
  const rows = records
    .filter(
      (r) =>
        r.isActive &&
        idOf(r.academicYear) === selection.academicYear &&
        idOf(r.teacherAssignment?.schoolClass) === selection.schoolClass &&
        idOf(r.teacherAssignment?.section) === selection.section,
    )
    .sort(
      (a, b) =>
        days.indexOf(a.day) - days.indexOf(b.day) ||
        (a.period?.startTime || "").localeCompare(b.period?.startTime || ""),
    );
  if (!rows.length)
    throw new Error("No active lessons exist for this class and section.");
  const content = [
    [
      "Academic year",
      "Class",
      "Section",
      "Day",
      "Period",
      "Start time",
      "End time",
      "Subject",
      "Teacher",
      "Room",
    ],
    ...rows.map((r) => {
      const a = r.teacherAssignment;
      return [
        r.academicYear?.name,
        a.schoolClass?.name,
        a.section?.name,
        r.day,
        r.period?.name,
        r.period?.startTime,
        r.period?.endTime,
        a.subject?.name,
        a.teacher?.user?.fullname,
        r.roomNumber,
      ];
    }),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  const first = rows[0];
  const filename =
    `timetable-${first.academicYear?.name}-${first.teacherAssignment.schoolClass?.name}-${first.teacherAssignment.section?.name}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    ) + ".csv";
  return { content: "\uFEFF" + content, filename };
}
