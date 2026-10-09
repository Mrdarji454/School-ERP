import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { management } from "../../config/management";
import { managementSchema } from "../../validations/managementSchemas";
import { initialManagementValues, managementPayload, dependentChanges, optionsFor, optionLabel, apiError } from "../../utils/management";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import PrimaryButton from "../ui/PrimaryButton";
import SecondaryButton from "../ui/SecondaryButton";

export default function ManagementForm({ resource, record, options, selectedYear, busy, onSave, onCancel }) {
  const config = management[resource], editing = Boolean(record);
  const { register, handleSubmit, control, setValue, setError, formState: { errors } } = useForm({ resolver: zodResolver(managementSchema(resource, editing)), defaultValues: initialManagementValues(resource, record, selectedYear) });
  const values = useWatch({ control });
  const blocked = editing && config.fields.some(field => field.immutable && !Array.isArray(field.options) && values[field.name] && !(options[field.options] || []).some(option => option._id === values[field.name] && option.eligible));
  const submit = handleSubmit(async data => {
    if (busy || blocked) return;
    try { await onSave(managementPayload(resource, data)); }
    catch (error) {
      for (const fieldError of error.response?.data?.errors || []) if (config.fields.some(f => f.name === fieldError.path) || fieldError.path === "password") setError(fieldError.path, { message: fieldError.message });
      setError("root", { message: apiError(error) });
    }
  });
  return <form onSubmit={submit} noValidate className="space-y-6">
    <p className="rounded-xl bg-blue-50 p-4 text-sm text-slate-700">{config.note}</p>
    {blocked && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">Restore the inactive or missing related records before saving. Historical relationships are shown below and cannot be reassigned.</p>}
    {errors.root && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{errors.root.message} Your entries have been kept; correct the issue and retry.</p>}
    <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">
      <legend className="sr-only">{config.singular} details</legend>
      {config.fields.map(field => {
        const fieldId = `management-${field.name}`, error = errors[field.name]?.message;
        const props = { id: fieldId, "aria-invalid": Boolean(error), "aria-describedby": error ? `${fieldId}-error` : undefined, ...register(field.name, { onChange: event => { if (["academicYear", "schoolClass"].includes(field.name)) for (const [key, value] of Object.entries(dependentChanges(field.name, event.target.value))) setValue(key, value, { shouldValidate: false }); } }) };
        if (field.type === "select") {
          const available = optionsFor(field, options, values);
          const current = (options[field.options] || []).find(option => option._id === values[field.name]);
          const locked = editing && field.immutable;
          // Disabled native selects are omitted by forms; readonly relationships use a visible label and hidden registered value.
          if (locked) return <div key={field.name} className="space-y-2"><label htmlFor={fieldId} className="text-sm font-medium text-slate-800">{field.label}</label><input id={fieldId} readOnly value={current ? optionLabel(current) : "Missing historical reference"} className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-slate-700" /><input type="hidden" {...register(field.name)} /><p className="text-xs text-slate-500">Relationship cannot be changed.</p></div>;
          return <SelectField key={field.name} label={field.label} error={error} {...props} required={field.required}>
            <option value="">{field.required ? `Select ${field.label.toLowerCase()}` : "None"}</option>
            {current && !available.some(option => option._id === current._id) && <option value={current._id} disabled>{optionLabel(current)}</option>}
            {available.map(option => <option key={option._id} value={option._id}>{optionLabel(option)}</option>)}
          </SelectField>;
        }
        if (field.type === "checkbox") return <label key={field.name} htmlFor={fieldId} className="flex items-center gap-3 rounded-xl border p-4 text-sm text-slate-800"><input type="checkbox" className="h-4 w-4" {...props} />{field.label}</label>;
        if (field.type === "textarea") return <div key={field.name} className="space-y-2 sm:col-span-2"><label htmlFor={fieldId} className="text-sm font-medium text-slate-800">{field.label}</label><textarea {...props} rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:ring-2 focus:ring-blue-500" />{error && <p id={`${fieldId}-error`} className="text-sm text-red-600">{error}</p>}</div>;
        return <InputField key={field.name} {...props} label={field.label} error={error} type={field.type} required={field.required} min={field.min} step={field.step} placeholder={field.placeholder} />;
      })}
    </fieldset>
    {resource === "teachers" && !editing && <fieldset disabled={busy} className="rounded-xl border border-blue-200 bg-blue-50 p-5"><legend className="px-2 font-semibold text-slate-800">Initial account credentials</legend><p className="mb-3 text-sm text-slate-600">An active Teacher account will be created with this profile. Share the initial password securely. It will not be shown in profile details.</p><InputField label="Initial password" id="initial-teacher-password" type="password" autoComplete="new-password" required aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "initial-teacher-password-error" : undefined} {...register("password")} error={errors.password?.message} /></fieldset>}
    <div className="flex flex-wrap justify-end gap-3 border-t pt-5"><SecondaryButton type="button" disabled={busy} onClick={onCancel}>Cancel</SecondaryButton><PrimaryButton type="submit" loading={busy} disabled={busy || blocked} className="sm:w-auto">{editing ? "Save changes" : `Create ${config.singular.toLowerCase()}`}</PrimaryButton></div>
  </form>;
}
