export default function AttendanceSummary({ summary, personal }) {
  const cards = [
    [
      "Attendance",
      summary.total ? `${summary.attendancePercentage}%` : "—",
      "bg-blue-50 text-blue-900",
    ],
    ["Present", summary.present, "bg-emerald-50 text-emerald-900"],
    ["Absent", summary.absent, "bg-red-50 text-red-900"],
    ["Late", summary.late, "bg-amber-50 text-amber-900"],
    ["Half Day", summary.halfDay, "bg-violet-50 text-violet-900"],
    ["Leave", summary.leave, "bg-slate-100 text-slate-800"],
  ];
  return (
    <section aria-label="Attendance summary" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map(([title, value, color]) => (
          <div
            key={title}
            className={`rounded-2xl border border-black/5 p-4 ${color}`}
          >
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        {summary.total} recorded {personal ? "personal" : "student-period"}{" "}
        entries across all matching pages. Attendance = Present ÷ all recorded
        entries. Missing sessions are not counted as absent.
      </p>
    </section>
  );
}
