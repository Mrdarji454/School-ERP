import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsFor, personValues, personPayload, personIdentifier } from '../../config/people';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import PasswordField from '../ui/PasswordField';
import PrimaryButton from '../ui/PrimaryButton';
import { apiError } from '../../utils/management';
export default function PersonForm({ kind, record, options, onSave, onBusy }) {
  const [enrollmentStart, setEnrollmentStart] = useState(''), [enrollmentReason, setEnrollmentReason] = useState('');
  const [values, setValues] = useState(() => personValues(kind, record)), [error, setError] = useState(''), [busy, setBusy] = useState(false), lock = useRef(false);
  const change = (name, value) => setValues(v => ({ ...v, [name]: value, ...(name === 'academicYear' ? { schoolClass: '', section: '' } : name === 'schoolClass' ? { section: '' } : {}) }));
  const choices = type => type === 'year' ? options.years : type === 'class' ? options.classes.filter(c => (c.academicYear?._id || c.academicYear) === values.academicYear) : type === 'section' ? options.sections.filter(s => (s.schoolClass?._id || s.schoolClass) === values.schoolClass) : [];
  return <form className="space-y-5" onSubmit={async e => { e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); onBusy?.(true); setError(''); try { await onSave({ ...personPayload(kind, values, Boolean(record)), ...(kind === 'students' && !record ? { enrollmentStart, enrollmentReason } : {}) }); setValues(v => ({ ...v, password: '' })); } catch (e) { setError(apiError(e)); } finally { lock.current = false; setBusy(false); onBusy?.(false); } }}>
    <p className="text-sm text-slate-500">Required fields are marked *. Other information is optional. {record ? `${personIdentifier(kind)}: ${record[personIdentifier(kind)]} (read-only)` : 'The identifier is generated on save.'}</p>
    {groupsFor(kind).map(([title, fields]) => <fieldset key={title} disabled={busy} className="rounded-xl border p-4"><legend className="px-2 font-semibold">{title}</legend><div className="grid gap-4 sm:grid-cols-2">{fields.map(field => {
      const props = { id: `person-${field.name}`, label: `${field.label}${field.required ? ' *' : ''}`, disabled: Boolean(record && kind === 'students' && ['academicYear', 'schoolClass', 'section', 'rollNumber'].includes(field.name)), required: field.required, readOnly: Boolean(record && field.name === 'email'), value: values[field.name], onChange: e => change(field.name, e.target.value) };
      if (['year', 'class', 'section', 'gender', 'status', 'employment'].includes(field.type)) {
        const simple = field.type === 'gender' ? ['Male', 'Female', 'Other'] : field.type === 'employment' ? ['Permanent', 'Contract', 'Guest'] : null;
        return <SelectField key={field.name} {...props}>{field.type !== 'status' && <option value="">Select {field.label.toLowerCase()}</option>}{field.type === 'status' ? <><option value="true">Active</option><option value="false">Inactive</option></> : simple ? simple.map(v => <option key={v}>{v}</option>) : choices(field.type).filter(v => v.eligible || v._id === values[field.name]).map(v => <option key={v._id} value={v._id}>{v.name}{!v.eligible ? ' (inactive)' : ''}</option>)}</SelectField>;
      }
      return <InputField key={field.name} {...props} type={field.type} min={field.name === 'rollNumber' ? 1 : 0} step={field.name === 'experience' ? 'any' : 1} />;
    })}{title === 'Account' && !record && <PasswordField id="initial-password" label="Initial password *" required minLength={8} value={values.password} onChange={e => change('password', e.target.value)} />}</div>{title === 'Account' && <p className="mt-3 text-sm text-slate-500">New accounts must change their initial password at first login. Use the separate Change login email action to update an existing login identifier.</p>}</fieldset>)}
    {kind === 'students' && !record && <div className="grid gap-4 sm:grid-cols-2"><InputField id="admission-effective" label="Enrollment start (blank = today in school timezone)" type="date" value={enrollmentStart} onChange={e => setEnrollmentStart(e.target.value)} /><InputField id="admission-reason" maxLength={200} label="Reason (required for backdated enrollment)" value={enrollmentReason} onChange={e => setEnrollmentReason(e.target.value)} /></div>}{kind === 'students' ? <p className="text-sm text-amber-800">Placement fields show the latest established placement. Use Enrollments for previewed transfers, withdrawals and promotions; profile edits cannot change placement.</p> : <p className="text-sm text-slate-600">Teachers can be created before allocation. <Link className="text-blue-700 underline" to="/admin/teacher-assignments">Manage teaching assignments</Link>. Salary and bank information are managed separately.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}<PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</PrimaryButton>
  </form>;
}
