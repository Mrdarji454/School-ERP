import { useRef, useState } from "react";
import { toast } from "sonner";
import { management } from "../../config/management";
import { useAcademicScope } from "../../context/AcademicScopeState";
import useManagementList from "../../hooks/useManagementList";
import { saveManagement, deactivateManagement, restoreManagement, setCurrentYear } from "../../services/managementService";
import { refId, recordName, displayDate, displayTime, optionLabel, apiError } from "../../utils/management";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/table/DataTable";
import Pagination from "../../components/table/Pagination";
import InputField from "../../components/ui/InputField";
import SelectField from "../../components/ui/SelectField";
import PrimaryButton from "../../components/ui/PrimaryButton";
import SecondaryButton from "../../components/ui/SecondaryButton";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/modal/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AcademicYearSelect from "../../components/management/AcademicYearSelect";
import ManagementForm from "../../components/management/ManagementForm";
import ManagementDetails from "../../components/management/ManagementDetails";

const reference = value => value?.name ? `${value.name}${value.isActive === false ? " (inactive)" : ""}` : "Missing reference";
function dataColumns(resource) {
  const name = { header: resource === "teachers" ? "Teacher" : resource === "teacher-assignments" ? "Teacher / subject" : "Name", render: row => <span className="font-semibold">{recordName(resource, row)}</span> };
  const year = { header: "Academic year", render: row => reference(row.academicYear || row.schoolClass?.academicYear) };
  const cls = { header: "Class", render: row => reference(row.schoolClass) };
  const columns = {
    "academic-years": [name, { header: "Date range", render: r => `${displayDate(r.startDate)} – ${displayDate(r.endDate)}` }, { header: "Current", render: r => r.isCurrent ? <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">Current year</span> : "—" }],
    classes: [name, year, { header: "Description", accessor: "description" }],
    sections: [name, year, cls, { header: "Capacity", accessor: "capacity" }, { header: "Class teacher", render: r => r.classTeacher?.user?.fullname || "None" }],
    subjects: [name, { header: "Code", accessor: "code" }, year, cls, { header: "Optional", render: r => r.isOptional ? "Yes" : "No" }],
    periods: [{ header: "Number", accessor: "periodNumber" }, name, { header: "Time range", render: r => `${displayTime(r.startTime)} – ${displayTime(r.endTime)}` }, { header: "Type", render: r => r.isBreak ? "Break" : "Teaching period" }],
    teachers: [name, { header: "Employee ID", accessor: "employeeId" }, { header: "Email", render: r => r.user?.email || "Missing account" }, { header: "Designation / department", render: r => `${r.designation}${r.department ? ` · ${r.department}` : ""}` }, { header: "Account", render: r => <StatusBadge status={r.user?.isActive ? "Active" : "Inactive"} /> }],
    "teacher-assignments": [name, year, cls, { header: "Section", render: r => reference(r.section) }, { header: "Class teacher", render: r => r.isClassTeacher ? "Yes" : "No" }],
  };
  return [...columns[resource], { header: "Status", render: r => <StatusBadge status={r.isActive ? "Active" : "Inactive"} /> }];
}

export default function ManagementPage({ resource }) {
  const config = management[resource];
  const scope = useAcademicScope();
  const [filters, setFilters] = useState({ search: "", status: "active", schoolClass: "", section: "", teacher: "", page: 1, limit: 10 });
  const query = { ...filters, ...(config.yearScoped && scope.year ? { academicYear: scope.year } : {}) };
  const list = useManagementList(resource, query);
  const [form, setForm] = useState(null), [detail, setDetail] = useState(null), [confirmation, setConfirmation] = useState(null), [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const changeFilter = (name, value) => setFilters(prev => ({ ...prev, [name]: value, page: 1, ...(name === "schoolClass" ? { section: "" } : {}) }));
  const changeYear = value => { scope.setYear(value); setFilters(prev => ({ ...prev, schoolClass: "", section: "", page: 1 })); };
  const execute = async (action, message) => {
    if (lock.current) throw new Error("A request is already in progress");
    lock.current = true; setBusy(true);
    try { const result = await action(); toast.success(message); list.reload(); await scope.refreshOptions(); return result; }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async data => { await execute(() => saveManagement(resource, form.record?._id, data), `${config.singular} saved`); setForm(null); };
  const ask = (action, record) => { setActionError(""); setConfirmation({ action, record }); };
  const confirm = async () => {
    if (lock.current) return;
    setActionError("");
    const { action, record } = confirmation;
    try {
      await execute(() => action === "current" ? setCurrentYear(record._id) : action === "restore" ? restoreManagement(resource, record._id) : deactivateManagement(resource, record._id), action === "current" ? "Current academic year changed" : `${config.singular} ${action === "restore" ? "restored" : "deactivated"}`);
      setConfirmation(null);
    } catch (error) { setActionError(apiError(error)); }
  };
  const columns = [...dataColumns(resource), { header: "Actions", render: record => <div className="flex flex-wrap gap-2 whitespace-nowrap">
    <button type="button" className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600" onClick={() => setDetail(record)}>{resource === "classes" ? "Details / dependencies" : "Details"}</button>
    <button type="button" disabled={busy || scope.loading || Boolean(scope.error)} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 disabled:opacity-50" onClick={() => setForm({ record })}>Edit</button>
    <button type="button" disabled={busy} className="rounded-lg border px-3 py-2 text-sm text-slate-700 disabled:opacity-50" onClick={() => ask(record.isActive ? "deactivate" : "restore", record)}>{record.isActive ? "Deactivate" : "Restore"}</button>
    {resource === "academic-years" && !record.isCurrent && record.isActive && <button type="button" disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={() => ask("current", record)}>Set current</button>}
  </div> }];
  const confirmAction = confirmation?.action;
  const confirmName = confirmation ? recordName(resource, confirmation.record) : "";
  const confirmMessage = confirmAction === "current" ? `Make “${confirmName}” the current academic year? The previous current year will be unset. This does not promote students or rewrite historical records.` : confirmAction === "restore" ? `Restore “${confirmName}”? Referenced records must be active and unique constraints must still be satisfied.${resource === "teachers" ? " The linked account will also be activated." : ""}` : `Deactivate “${confirmName}”? This is reversible and historical records are retained.${resource === "teachers" ? " The linked account will lose access immediately." : resource === "classes" ? " Linked students, sections, subjects, and assignments are retained but the class is no longer eligible. Review Details / dependencies first." : resource === "academic-years" ? " If this is the current year, its current status will be cleared." : " Inactive records are excluded from eligible selections."}`;
  return <>
    <PageHeader title={config.title} subtitle={config.description} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="max-w-4xl text-sm text-slate-600">{config.note}</p><PrimaryButton className="sm:w-auto" disabled={busy || scope.loading || Boolean(scope.error)} onClick={() => setForm({ record: null })}>Add {config.singular.toLowerCase()}</PrimaryButton></div>
    {scope.error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700"><p>Academic options could not be loaded: {scope.error}</p><SecondaryButton onClick={scope.refreshOptions}>Retry options</SecondaryButton></div>}
    <section aria-label={`${config.title} filters`} className="mb-5 grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <InputField id="management-search" label="Search" type="search" value={filters.search} maxLength={100} placeholder={resource === "teachers" ? "Name, email, employee ID..." : "Search records..."} onChange={e => changeFilter("search", e.target.value)} />
      {config.yearScoped && <AcademicYearSelect years={scope.options.years} value={scope.year} onChange={changeYear} disabled={scope.loading} />}
      {config.classScoped && <SelectField id="management-class-filter" label="Class" value={filters.schoolClass} onChange={e => changeFilter("schoolClass", e.target.value)} disabled={scope.loading}><option value="">All classes</option>{scope.options.classes.filter(c => !scope.year || refId(c.academicYear) === scope.year).map(c => <option key={c._id} value={c._id}>{optionLabel(c)} · {scope.options.years.find(y => y._id === refId(c.academicYear))?.name}</option>)}</SelectField>}
      {resource === "teacher-assignments" && <>
        <SelectField id="assignment-section-filter" label="Section" value={filters.section} onChange={e => changeFilter("section", e.target.value)} disabled={!filters.schoolClass || scope.loading}><option value="">All sections</option>{scope.options.sections.filter(s => refId(s.schoolClass) === filters.schoolClass).map(s => <option key={s._id} value={s._id}>{optionLabel(s)}</option>)}</SelectField>
        <SelectField id="assignment-teacher-filter" label="Teacher" value={filters.teacher} onChange={e => changeFilter("teacher", e.target.value)} disabled={scope.loading}><option value="">All teachers</option>{scope.options.teachers.map(t => <option key={t._id} value={t._id}>{optionLabel(t)}</option>)}</SelectField>
      </>}
      <SelectField id="management-status" label="Status" value={filters.status} onChange={e => changeFilter("status", e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></SelectField>
      <SelectField id="management-page-size" label="Rows per page" value={filters.limit} onChange={e => changeFilter("limit", Number(e.target.value))}>{[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}</SelectField>
      <div className="flex flex-wrap items-end gap-2"><SecondaryButton onClick={() => { if (config.yearScoped) scope.setYear(""); setFilters({ search: "", status: "active", schoolClass: "", section: "", teacher: "", page: 1, limit: 10 }); }}>Reset filters</SecondaryButton><SecondaryButton disabled={list.loading} onClick={list.reload}>Refresh</SecondaryButton></div>
    </section>
    {list.error && !list.loading ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-700"><p>{list.error}</p><SecondaryButton className="mt-3" onClick={list.reload}>Retry list</SecondaryButton></div> : <>
      <p role="status" className="mb-3 text-sm text-slate-600">{list.loading ? "Loading records..." : `${list.pagination.total} matching ${list.pagination.total === 1 ? "record" : "records"}`}</p>
      <DataTable columns={columns} data={list.records} loading={list.loading} emptyMessage="No matching records. Change filters or add a record." />
      <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} disabled={list.loading || busy} onPageChange={page => setFilters(prev => ({ ...prev, page }))} />
    </>}
    <Modal isOpen={Boolean(form)} onClose={() => { if (!busy) setForm(null); }} busy={busy} title={`${form?.record ? "Edit" : "Add"} ${config.singular.toLowerCase()}`} width="max-w-3xl">
      {form && <ManagementForm key={form.record?._id || "new"} resource={resource} record={form.record} options={scope.options} selectedYear={scope.options.years.some(y => y._id === scope.year && y.eligible) ? scope.year : ""} busy={busy} onSave={save} onCancel={() => setForm(null)} />}
    </Modal>
    <Modal isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={`${config.singular} details`} width="max-w-3xl">{detail && <ManagementDetails resource={resource} record={detail} />}</Modal>
    <ConfirmDialog isOpen={Boolean(confirmation)} onClose={() => { if (!busy) setConfirmation(null); }} onConfirm={confirm} loading={busy} title={confirmAction === "current" ? "Change current academic year" : `${confirmAction === "restore" ? "Restore" : "Deactivate"} ${config.singular.toLowerCase()}`} confirmLabel={confirmAction === "current" ? "Set current year" : confirmAction === "restore" ? "Restore" : "Deactivate"} message={confirmMessage} error={actionError} />
  </>;
}
