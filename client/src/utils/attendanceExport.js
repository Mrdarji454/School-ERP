import { idOf, validSchoolDateRange } from "./workflow.js";

const cell = (value) => {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export async function collectAttendanceExport(read, filters) {
  if (!filters.academicYear || !filters.schoolClass || !filters.section)
    throw new Error("Select academic year, class and section to export.");
  if (!validSchoolDateRange(filters.from, filters.to))
    throw new Error("End date must be on or after start date.");
  const query = { ...filters, page: 1, limit: 100 };
  const first = await read("attendance", query);
  const records = [...first.records];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await read("attendance", { ...query, page });
    if (
      next.pagination.total !== first.pagination.total ||
      next.pagination.page !== page
    )
      throw new Error(
        "Attendance changed during export. Refresh and try again.",
      );
    records.push(...next.records);
  }
  if (
    records.length !== first.pagination.total ||
    new Set(records.map((r) => r._id)).size !== records.length
  )
    throw new Error("Attendance changed during export. Refresh and try again.");
  if (!records.length)
    throw new Error("No attendance matches the selected filters.");
  if (
    records.some((r) =>
      ["academicYear", "schoolClass", "section"].some(
        (key) => idOf(r.teacherAssignment?.[key]) !== filters[key],
      ),
    )
  )
    throw new Error(
      "Attendance does not match the selected class and section. Refresh and try again.",
    );
  return records;
}

export function attendanceCsv(records) {
  const header = [
    "School date",
    "Academic year",
    "Class",
    "Section",
    "Subject",
    "Teacher",
    "Period",
    "Start time",
    "End time",
    "Recorded entries",
    "Present",
    "Absent",
    "Late",
    "Half Day",
    "Leave",
    "Attendance percentage (Present only)",
    "Record state",
    "Lock state",
  ];
  const rows = records.map((r) => {
    const a = r.teacherAssignment,
      c = r.counts;
    return [
      r.attendanceDate.slice(0, 10),
      a?.academicYear?.name,
      a?.schoolClass?.name,
      a?.section?.name,
      a?.subject?.name,
      a?.teacher?.user?.fullname,
      r.period?.name,
      r.period?.startTime,
      r.period?.endTime,
      c.total,
      c.present,
      c.absent,
      c.late,
      c.halfDay,
      c.leave,
      c.total ? c.attendancePercentage : "",
      r.isActive ? "Active" : "Inactive",
      r.isLocked ? "Locked" : "Unlocked",
    ];
  });
  return (
    "\uFEFF" +
    [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")
  );
}
