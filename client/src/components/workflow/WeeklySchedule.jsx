import { useState } from "react";
import DataTable from "../table/DataTable";
import SecondaryButton from "../ui/SecondaryButton";
import {
  days,
  assignmentLabel,
  timeLabel,
  idOf,
  label,
} from "../../utils/workflow";

function Lesson({ record, actions }) {
  const a = record.teacherAssignment;
  return (
    <div
      className={`space-y-2 rounded-xl border-l-4 p-3 ${record.isActive ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-100"}`}
    >
      <p className="font-semibold text-slate-900">{label(a?.subject)}</p>
      <p className="text-sm text-slate-600">
        {a?.teacher?.user?.fullname || "Missing teacher"}
      </p>
      <p className="text-xs text-slate-500">
        Room: {record.roomNumber || "Not assigned"}
        {!record.isActive && " · Inactive booking"}
      </p>
      {actions && (
        <details className="text-sm">
          <summary className="cursor-pointer py-1 font-medium text-blue-700">
            Lesson actions
          </summary>
          <div className="mt-2">{actions(record)}</div>
        </details>
      )}
    </div>
  );
}

export default function WeeklySchedule({
  records,
  periods = [],
  actions,
  selectedDay = "",
}) {
  const [view, setView] = useState("grid");
  const rows = [...records].sort(
    (a, b) =>
      days.indexOf(a.day) - days.indexOf(b.day) ||
      (a.period?.startTime || "").localeCompare(b.period?.startTime || ""),
  );
  const columns = [
    { header: "Day", accessor: "day" },
    { header: "Period", render: (r) => timeLabel(r.period) },
    {
      header: "Class / subject / teacher",
      render: (r) => assignmentLabel(r.teacherAssignment),
    },
    { header: "Room", render: (r) => r.roomNumber || "Not assigned" },
    { header: "Status", render: (r) => (r.isActive ? "Active" : "Inactive") },
    ...(actions ? [{ header: "Actions", render: actions }] : []),
  ];
  const groups = new Map();
  for (const row of rows) {
    const a = row.teacherAssignment;
    const key = [
      idOf(row.academicYear),
      idOf(a?.schoolClass),
      idOf(a?.section),
    ].join(":");
    if (!groups.has(key))
      groups.set(key, {
        key,
        title: `${label(a?.schoolClass)} · Section ${label(a?.section)}`,
        year: label(row.academicYear),
        rows: [],
      });
    groups.get(key).rows.push(row);
  }
  const visibleDays = selectedDay
    ? [selectedDay]
    : days.filter((day) => day !== "Sunday" || rows.some((r) => r.day === day));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {rows.length} lessons · {groups.size} class sections
        </p>
        <div className="flex gap-2">
          <SecondaryButton
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={
              view === "grid"
                ? "border-blue-600! bg-blue-50! text-blue-800!"
                : ""
            }
          >
            Weekly view
          </SecondaryButton>
          <SecondaryButton
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={
              view === "list"
                ? "border-blue-600! bg-blue-50! text-blue-800!"
                : ""
            }
          >
            List view
          </SecondaryButton>
        </div>
      </div>
      {!rows.length && (
        <p className="rounded-xl border bg-=black p-5 text-slate-600">
          No lessons match these filters. Try another class, section or day.
        </p>
      )}
      {view === "list" && (
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No timetable bookings"
        />
      )}
      {view === "grid" &&
        [...groups.values()].map((group) => {
          const gridPeriods = [
            ...new Map(
              [
                ...periods.filter((p) => p.isActive),
                ...group.rows.map((r) => r.period).filter(Boolean),
              ].map((p) => [idOf(p), p]),
            ).values(),
          ].sort((a, b) => a.startTime.localeCompare(b.startTime));
          const lessonsAt = (day, period) =>
            group.rows.filter(
              (r) => r.day === day && idOf(r.period) === idOf(period),
            );
          const content = (day, period) =>
            period.isBreak ? (
              <p className="rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-800">
                Break
              </p>
            ) : lessonsAt(day, period).length ? (
              lessonsAt(day, period).map((r) => (
                <Lesson key={r._id} record={r} actions={actions} />
              ))
            ) : (
              <p className="p-3 text-center text-xs text-slate-400">
                No lesson shown
              </p>
            );
          return (
            <section
              key={group.key}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {group.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Academic year {group.year}
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  {group.rows.length} lessons shown
                </p>
              </div>
              <div className="space-y-5 p-4 md:hidden">
                {visibleDays.map((day) => (
                  <div key={day}>
                    <h3 className="mb-2 font-semibold text-slate-900">{day}</h3>
                    <div className="space-y-2">
                      {gridPeriods.map((period) => (
                        <div
                          key={idOf(period)}
                          className="grid grid-cols-[85px_1fr] gap-3 border-t border-slate-100 pt-2"
                        >
                          <div className="text-xs text-slate-500">
                            <p className="font-medium text-slate-700">
                              {period.name}
                            </p>
                            <p>{period.startTime}</p>
                            <p>{period.endTime}</p>
                          </div>
                          <div className="space-y-2">
                            {content(day, period)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div
                tabIndex={0}
                role="region"
                aria-label={`${group.title} weekly timetable`}
                className="hidden overflow-x-auto md:block"
              >
                <table className="w-full min-w-262.5 table-fixed text-sm ">
                  <caption className="sr-only">
                    Days by period. Breaks are reference times. Empty cells have
                    no lesson in the current filters.
                  </caption>
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="w-28 border-b text-black bg-slate-50 p-3 text-left"
                      >
                        Day
                      </th>
                      {gridPeriods.map((p) => (
                        <th
                          scope="col"
                          key={idOf(p)}
                          className={`border-b border-l p-3 ${p.isBreak ? "bg-amber-50" : "bg-slate-50"}`}
                        >
                          <span className="block text-black font-semibold">
                            {p.name}
                          </span>
                          <span className="mt-1 block text-xs font-normal text-slate-500">
                            {p.startTime}–{p.endTime}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDays.map((day) => (
                      <tr key={day}>
                        <th
                          scope="row"
                          className="border-b text-black bg-slate-50 p-3 text-left font-semibold"
                        >
                          {day}
                        </th>
                        {gridPeriods.map((period) => (
                          <td
                            key={idOf(period)}
                            className="space-y-2 border-b border-l border-slate-200 p-2 align-top"
                          >
                            {content(day, period)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
    </div>
  );
}
