import { useRef, useState } from 'react';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import { days, idOf, assignmentLabel, timeLabel, filterAssignments, uniqueReferences, label } from '../../utils/workflow';
import { apiError } from '../../utils/management';
import { saveSchedule } from '../../services/workflowService';
export default function ScheduleForm({ record, options, onSaved, onCancel, onBusy }) {
  const [values, setValues] = useState({ academicYear: idOf(record?.academicYear), schoolClass: idOf(record?.teacherAssignment?.schoolClass), section: idOf(record?.teacherAssignment?.section), teacherAssignment: idOf(record?.teacherAssignment), period: idOf(record?.period), day: record?.day || 'Monday', roomNumber: record?.roomNumber || '' });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), lock = useRef(false);
  const eligible = options.assignments.filter(a => a.eligible);
  const change = (key, value) => setValues(v => ({ ...v, [key]: value, ...(['academicYear', 'schoolClass', 'section'].includes(key) ? { teacherAssignment: '' } : {}), ...(key === 'academicYear' ? { schoolClass: '', section: '' } : {}), ...(key === 'schoolClass' ? { section: '' } : {}) }));
  const assignmentOptions = filterAssignments(eligible, values);
  const periodOptions = options.periods.filter(p => p.isActive && !p.isBreak);
  const submit = async event => {
    event.preventDefault(); if (lock.current) return;
    if (!assignmentOptions.some(a => a._id === values.teacherAssignment) || !periodOptions.some(p => p._id === values.period)) { setError('Choose an eligible assignment and teaching period. Restore inactive references first.'); return; }
    lock.current = true; setBusy(true); onBusy(true); setError('');
    try { await saveSchedule(record?._id, { academicYear: values.academicYear, teacherAssignment: values.teacherAssignment, period: values.period, day: values.day, roomNumber: values.roomNumber }); onSaved(); }
    catch (e) { setError(apiError(e)); }
    finally { lock.current = false; setBusy(false); onBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-5"><p className="rounded-xl bg-blue-50 p-4 text-sm text-slate-700">Only eligible assignments and teaching periods can be booked. Teacher, class/section and room overlaps are checked by the server. Editing a booking never changes recorded attendance. Saving an inactive booking restores it.</p>{error && <p role="alert" className="text-red-700">{error} Your entries are retained.</p>}<fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Timetable booking</legend>
    <SelectField id="schedule-year" label="Academic year" required disabled={Boolean(record)} value={values.academicYear} onChange={e => change('academicYear', e.target.value)}><option value="">Select year</option>{uniqueReferences(options.assignments, 'academicYear').map(y => <option key={y._id} value={y._id}>{label(y)}</option>)}</SelectField>
    <SelectField id="schedule-class" label="Class" required value={values.schoolClass} onChange={e => change('schoolClass', e.target.value)}><option value="">Select class</option>{uniqueReferences(filterAssignments(options.assignments, { academicYear: values.academicYear }), 'schoolClass').map(c => <option key={c._id} value={c._id}>{label(c)}</option>)}</SelectField>
    <SelectField id="schedule-section" label="Section" required value={values.section} onChange={e => change('section', e.target.value)}><option value="">Select section</option>{uniqueReferences(filterAssignments(options.assignments, { academicYear: values.academicYear, schoolClass: values.schoolClass }), 'section').map(c => <option key={c._id} value={c._id}>{label(c)}</option>)}</SelectField>
    <SelectField id="schedule-assignment" label="Teacher assignment" required value={values.teacherAssignment} onChange={e => change('teacherAssignment', e.target.value)}><option value="">Select assignment</option>{record && !assignmentOptions.some(a => a._id === idOf(record.teacherAssignment)) && <option value={idOf(record.teacherAssignment)} disabled>{assignmentLabel(record.teacherAssignment)} (unavailable)</option>}{assignmentOptions.map(a => <option key={a._id} value={a._id}>{assignmentLabel(a)}</option>)}</SelectField>
    <SelectField id="schedule-period" label="Period" required value={values.period} onChange={e => change('period', e.target.value)}><option value="">Select teaching period</option>{record && !periodOptions.some(p => p._id === idOf(record.period)) && <option value={idOf(record.period)} disabled>{timeLabel(record.period)}</option>}{periodOptions.map(p => <option key={p._id} value={p._id}>{timeLabel(p)}</option>)}</SelectField>
    <SelectField id="schedule-day" label="Day" value={values.day} onChange={e => change('day', e.target.value)}>{days.map(day => <option key={day}>{day}</option>)}</SelectField>
    <InputField id="schedule-room" label="Room (optional)" value={values.roomNumber} maxLength={100} onChange={e => change('roomNumber', e.target.value)} />
    </fieldset><div className="flex justify-end gap-3"><SecondaryButton disabled={busy} onClick={onCancel}>Cancel</SecondaryButton><PrimaryButton type="submit" loading={busy}>Save booking</PrimaryButton></div></form>;
}
