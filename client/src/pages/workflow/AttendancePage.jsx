import { useRef, useState } from "react";
import { toast } from "sonner";
import AttendanceSummary from "../../components/workflow/AttendanceSummary";
import {
  attendanceCsv,
  collectAttendanceExport,
} from "../../utils/attendanceExport";
import { workflowRead } from "../../services/workflowService";
import { apiError } from "../../utils/management";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthState";
import useWorkflow from "../../hooks/useWorkflow";
import PageHeader from "../../components/layout/PageHeader";
import RequestState from "../../components/workflow/RequestState";
import AcademicFilters from "../../components/workflow/AcademicFilters";
import AttendanceEditor from "../../components/workflow/AttendanceEditor";
import DataTable from "../../components/table/DataTable";
import Pagination from "../../components/table/Pagination";
import InputField from "../../components/ui/InputField";
import SelectField from "../../components/ui/SelectField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import SecondaryButton from "../../components/ui/SecondaryButton";
import {
  assignmentLabel,
  timeLabel,
  attendanceStatuses,
  uniqueReferences,
  label,
  filterAssignments,
  validSchoolDateRange,
} from "../../utils/workflow";
export default function AttendancePage() {
  const { user } = useAuth(),
    personal = user.role === "Student",
    admin = user.role === "Admin";
  const [params] = useSearchParams();
  const options = useWorkflow("options");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "active",
    from: "",
    to: "",
    subject: "",
    teacherAssignment: "",
    academicYear: "",
    schoolClass: "",
    section: "",
    teacher: "",
    studentStatus: "",
    locked: "",
  });
  const dateRangeValid = validSchoolDateRange(filters.from, filters.to);
  const list = useWorkflow("attendance", filters, dateRangeValid);
  const [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);
  const canExport = Boolean(
    filters.academicYear &&
    filters.schoolClass &&
    filters.section &&
    dateRangeValid,
  );
  const exportAttendance = async () => {
    if (!canExport || exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    const selection = { ...filters };
    try {
      const records = await collectAttendanceExport(workflowRead, selection);
      const url = URL.createObjectURL(
        new Blob([attendanceCsv(records)], { type: "text/csv;charset=utf-8;" }),
      );
      const a = records[0].teacherAssignment;
      const name =
        `attendance-${a.academicYear?.name}-${a.schoolClass?.name}-${a.section?.name}-${selection.from || "start"}-${selection.to || "latest"}`.replace(
          /[^a-zA-Z0-9_-]/g,
          "-",
        );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${records.length} attendance sessions`);
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  };
  const [editor, setEditor] = useState(() =>
    !personal && (params.get("assignment") || params.get("record"))
      ? {
          id: params.get("record"),
          defaults: {
            teacherAssignment: params.get("assignment"),
            period: params.get("period"),
            date: params.get("date"),
          },
        }
      : null,
  );
  const change = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  const columns = personal
    ? [
        { header: "School date", render: (r) => r.attendanceDate.slice(0, 10) },
        { header: "Subject", render: (r) => label(r.subject) },
        { header: "Period", render: (r) => timeLabel(r.period) },
        { header: "Recorded status", accessor: "status" },
      ]
    : [
        {
          header: "Date / period",
          render: (r) => (
            <div className="min-w-32">
              <p className="font-semibold">{r.attendanceDate.slice(0, 10)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {timeLabel(r.period)}
              </p>
            </div>
          ),
        },
        {
          header: "Class / lesson",
          render: (r) => (
            <div className="min-w-44">
              <p className="font-semibold">
                {label(r.teacherAssignment?.schoolClass)} /{" "}
                {label(r.teacherAssignment?.section)}
              </p>
              <p className="mt-1 text-blue-700">
                {label(r.teacherAssignment?.subject)}
              </p>
              <p className="text-xs text-slate-500">
                {r.teacherAssignment?.teacher?.user?.fullname ||
                  "Missing teacher"}
              </p>
            </div>
          ),
        },
        {
          header: "Student counts",
          render: (r) => (
            <div className="min-w-52">
              <p className="mb-2 text-xs text-slate-500">
                {r.counts.total} recorded entries
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  ["Present", "present", "bg-emerald-50 text-emerald-800"],
                  ["Absent", "absent", "bg-red-50 text-red-800"],
                  ["Late", "late", "bg-amber-50 text-amber-800"],
                  ["Half Day", "halfDay", "bg-violet-50 text-violet-800"],
                  ["Leave", "leave", "bg-slate-100 text-slate-700"],
                ].map(([title, key, color]) => (
                  <span
                    key={key}
                    className={`rounded-md px-2 py-1 text-xs ${color}`}
                  >
                    {title} {r.counts[key]}
                  </span>
                ))}
              </div>
            </div>
          ),
        },
        {
          header: "Attendance",
          render: (r) => (
            <span className="font-semibold">
              {r.counts.total
                ? `${r.counts.attendancePercentage}%`
                : "No entries"}
            </span>
          ),
        },
        {
          header: "Record state",
          render: (r) => (
            <div className="space-y-1 text-xs">
              <p
                className={
                  r.isActive
                    ? "font-medium text-emerald-700"
                    : "font-medium text-slate-500"
                }
              >
                {r.isActive ? "Active" : "Inactive"}
              </p>
              <p className={r.isLocked ? "text-amber-700" : "text-slate-500"}>
                {r.isLocked ? "Locked" : "Unlocked"}
              </p>
            </div>
          ),
        },
        {
          header: "Review",
          render: (r) => (
            <SecondaryButton onClick={() => setEditor({ id: r._id })}>
              {admin ? "Review session" : "View / edit"}
            </SecondaryButton>
          ),
        },
      ];
  return (
    <div className="space-y-5">
      <PageHeader
        title={
          personal
            ? "My attendance"
            : admin
              ? "Attendance review"
              : "Attendance & history"
        }
        subtitle={
          personal
            ? "Your recorded attendance by subject and date."
            : "Review recorded lessons by class, section and date. Open a session to view individual students."
        }
      />
      <RequestState request={options}>
        {options.data && (
          <>
            <section
              aria-label="Attendance filters"
              className="grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="sm:col-span-2 xl:col-span-4">
                <h2 className="font-semibold text-slate-900">
                  Find attendance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {personal
                    ? "Choose a subject or date range to review your attendance."
                    : "Choose a class and section, then narrow the date range or lesson."}
                </p>
              </div>
              {!personal && (
                <AcademicFilters
                  assignments={options.data.assignments}
                  values={filters}
                  includeTeacher={admin}
                  onChange={(f) =>
                    setFilters({ ...f, teacherAssignment: "", page: 1 })
                  }
                />
              )}
              {!personal && (
                <SelectField
                  id="attendance-assignment-filter"
                  label="Subject / teacher assignment"
                  value={filters.teacherAssignment}
                  onChange={(e) => change("teacherAssignment", e.target.value)}
                >
                  <option value="">All assignments</option>
                  {filterAssignments(options.data.assignments, filters).map(
                    (a) => (
                      <option key={a._id} value={a._id}>
                        {assignmentLabel(a)}
                      </option>
                    ),
                  )}
                </SelectField>
              )}
              {personal && (
                <SelectField
                  id="attendance-subject-filter"
                  label="Subject"
                  value={filters.subject}
                  onChange={(e) => change("subject", e.target.value)}
                >
                  <option value="">All subjects</option>
                  {uniqueReferences(options.data.assignments, "subject").map(
                    (s) => (
                      <option key={s._id} value={s._id}>
                        {label(s)}
                      </option>
                    ),
                  )}
                </SelectField>
              )}
              <InputField
                id="attendance-from"
                label="From school date"
                type="date"
                max={filters.to || undefined}
                value={filters.from}
                onChange={(e) => change("from", e.target.value)}
              />
              <InputField
                id="attendance-to"
                label="To school date"
                type="date"
                min={filters.from || undefined}
                value={filters.to}
                onChange={(e) => change("to", e.target.value)}
              />
              <SelectField
                id="attendance-status-filter"
                label={personal ? "Recorded status" : "Session contains status"}
                value={filters.studentStatus}
                onChange={(e) => change("studentStatus", e.target.value)}
              >
                <option value="">All recorded statuses</option>
                {attendanceStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </SelectField>
              {!personal && (
                <>
                  <SelectField
                    id="attendance-record-status"
                    label="Record state"
                    value={filters.status}
                    onChange={(e) => change("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </SelectField>
                  <SelectField
                    id="attendance-lock-filter"
                    label="Lock state"
                    value={filters.locked}
                    onChange={(e) => change("locked", e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Locked</option>
                    <option value="false">Unlocked</option>
                  </SelectField>
                </>
              )}
              <SelectField
                id="attendance-limit"
                label="Sessions per page"
                value={filters.limit}
                onChange={(e) => change("limit", Number(e.target.value))}
              >
                {[20, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </SelectField>
              <div className="flex flex-wrap items-end gap-2">
                <SecondaryButton
                  onClick={() =>
                    setFilters({
                      page: 1,
                      limit: 20,
                      status: "active",
                      from: "",
                      to: "",
                      subject: "",
                      teacherAssignment: "",
                      academicYear: "",
                      schoolClass: "",
                      section: "",
                      teacher: "",
                      studentStatus: "",
                      locked: "",
                    })
                  }
                >
                  Reset filters
                </SecondaryButton>
                <SecondaryButton onClick={list.reload}>Refresh</SecondaryButton>
              </div>
            </section>
            {!personal && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <div>
                  {admin && (
                    <>
                      <p
                        id="attendance-export-help"
                        className="text-sm text-slate-600"
                      >
                        Select academic year, class and section to export
                        session totals. CSV includes all matching pages and
                        follows every filter above.
                      </p>
                      <SecondaryButton
                        aria-describedby="attendance-export-help"
                        className="mt-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canExport || exporting}
                        onClick={exportAttendance}
                      >
                        {exporting
                          ? "Exporting all pages..."
                          : "Export attendance (CSV)"}
                      </SecondaryButton>
                    </>
                  )}
                </div>
                <PrimaryButton
                  className="sm:w-auto"
                  onClick={() => setEditor({})}
                >
                  Mark attendance
                </PrimaryButton>
              </div>
            )}
            {!dateRangeValid ? (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"
              >
                End date must be on or after start date. Update the date range
                to view attendance.
              </p>
            ) : (
              <RequestState request={list}>
                {list.data && (
                  <>
                    <AttendanceSummary
                      summary={list.data.summary}
                      personal={personal}
                    />
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {personal
                          ? "Your recorded attendance"
                          : "Attendance sessions"}
                      </h2>
                      <p className="mb-3 text-sm text-slate-500">
                        {list.data.pagination.total} matching records
                        {!personal &&
                          " - One row per lesson. Status filters select sessions containing that status; counts include all students in those sessions."}
                      </p>
                    </div>
                    <div className={personal ? "" : "hidden md:block"}>
                      <DataTable
                        columns={columns}
                        data={list.data.records}
                        emptyMessage="No recorded attendance matches these filters"
                      />
                    </div>
                    {!personal && (
                      <div className="space-y-3 md:hidden">
                        {!list.data.records.length && (
                          <p className="rounded-xl border bg-white p-5 text-slate-500">
                            No recorded attendance matches these filters
                          </p>
                        )}
                        {list.data.records.map((record) => (
                          <article
                            key={record._id}
                            className="space-y-4 rounded-2xl border bg-white p-4"
                          >
                            {columns.map((column) => (
                              <div key={column.header}>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                  {column.header}
                                </p>
                                {column.render(record)}
                              </div>
                            ))}
                          </article>
                        ))}
                      </div>
                    )}
                    <Pagination
                      page={list.data.pagination.page}
                      totalPages={list.data.pagination.totalPages}
                      onPageChange={(page) =>
                        setFilters((f) => ({ ...f, page }))
                      }
                    />
                  </>
                )}
              </RequestState>
            )}
          </>
        )}
      </RequestState>
      {editor && options.data && (
        <AttendanceEditor
          key={editor.id || "new"}
          id={editor.id}
          defaults={editor.defaults}
          options={options.data}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}
