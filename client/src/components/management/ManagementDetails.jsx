import { useEffect, useState } from "react";
import { management } from "../../config/management";
import { useAcademicScope } from "../../context/AcademicScopeState";
import { initialManagementValues, optionLabel, displayDate, displayTime, apiError } from "../../utils/management";
import { getClassDependencies } from "../../services/managementService";
import SecondaryButton from "../ui/SecondaryButton";
function ClassDependencies({ id }) {
  const [result, setResult] = useState(null), [error, setError] = useState(""), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getClassDependencies(id, controller.signal).then(data => { if (!controller.signal.aborted) { setResult(data); setError(""); } }).catch(err => { if (!controller.signal.aborted) setError(apiError(err)); });
    return () => controller.abort();
  }, [id, revision]);
  if (error) return <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <SecondaryButton onClick={() => setRevision(n => n + 1)}>Retry dependencies</SecondaryButton></div>;
  if (!result) return <p role="status">Loading class dependencies...</p>;
  return <section className="rounded-xl border p-4"><h3 className="mb-3 font-semibold text-slate-900">Linked records</h3><dl className="grid grid-cols-2 gap-4">{Object.entries(result).map(([key, counts]) => <div key={key}><dt className="capitalize text-slate-600">{key}</dt><dd className="font-medium text-slate-900">{counts.active} active / {counts.total} total</dd></div>)}</dl><p className="mt-3 text-sm text-slate-600">Deactivation keeps these records. New selections and eligible schedules exclude an inactive parent class; restore it to make those relationships eligible again.</p></section>;
}
export default function ManagementDetails({ resource, record }) {
  const { options } = useAcademicScope();
  const values = initialManagementValues(resource, record);
  return <div className="space-y-5">
    <dl className="grid gap-4 sm:grid-cols-2">
      {resource === "teachers" && <div className="sm:col-span-2"><dt className="text-sm text-slate-500">Employee identifier</dt><dd className="break-all font-medium text-slate-900">{record.employeeId}</dd></div>}
      {management[resource].fields.map(field => {
        let value = values[field.name];
        if (field.type === "checkbox") value = value ? "Yes" : "No";
        else if (field.type === "date") value = displayDate(value);
        else if (field.type === "time") value = displayTime(value);
        else if (field.type === "select" && !Array.isArray(field.options)) { const option = options[field.options]?.find(o => o._id === value); value = option ? optionLabel(option) : value ? "Missing historical reference" : "None"; }
        return <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}><dt className="text-sm text-slate-500">{field.label}</dt><dd className="break-words whitespace-pre-wrap font-medium text-slate-900">{value === 0 ? "0" : value || "—"}</dd></div>;
      })}
      <div><dt className="text-sm text-slate-500">Profile status</dt><dd className="font-medium text-slate-900">{record.isActive ? "Active" : "Inactive"}</dd></div>
      {resource === "teachers" && <div><dt className="text-sm text-slate-500">Linked account status</dt><dd className="font-medium text-slate-900">{record.user ? record.user.isActive ? "Active" : "Inactive" : "Missing account"}</dd></div>}
      {resource === "academic-years" && <div><dt className="text-sm text-slate-500">Current year</dt><dd className="font-medium text-slate-900">{record.isCurrent ? "Yes" : "No"}</dd></div>}
    </dl>
    {resource === "classes" && <ClassDependencies id={record._id} />}
  </div>;
}
