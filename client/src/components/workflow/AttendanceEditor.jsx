import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthState';
import useWorkflow from '../../hooks/useWorkflow';
import useUnsavedAttendance from '../../hooks/useUnsavedAttendance';
import { attendancePayload, rosterRows, attendanceStatuses, assignmentLabel, timeLabel, idOf } from '../../utils/workflow';
import { apiError } from '../../utils/management';
import { saveAttendance, changeAttendanceLock, deactivateAttendance } from '../../services/workflowService';
import RequestState from './RequestState';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../modal/Modal';

function AttendanceRows({ record, roster = [], selection, onSaved, onClose, reload }) {
  const { user } = useAuth(), admin = user.role === 'Admin';
  const initial = rosterRows(roster, record);
  const [rows, setRows] = useState(initial), [editing, setEditing] = useState(!record), [busy, setBusy] = useState(false), [error, setError] = useState(''), [feedback, setFeedback] = useState('');
  const [action, setAction] = useState(''), [reason, setReason] = useState(''), [actionError, setActionError] = useState(''), [saved, setSaved] = useState(false);
  const [reviewReason, setReviewReason] = useState(''), [pendingStudents, setPendingStudents] = useState(null);
  const lock = useRef(false);
  const dirty = !saved && (JSON.stringify(rows) !== JSON.stringify(initial) || Boolean(reviewReason));
  const blocker = useUnsavedAttendance(dirty, busy);
  const readOnly = !editing || record?.isLocked || record?.isActive === false;
  const leave = fn => { if (!busy && (!dirty || window.confirm('Discard unsaved attendance changes?'))) fn(); };
  const update = (index, key, value) => setRows(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const persist = async students => {
    if (lock.current || readOnly) return;
    lock.current = true; setBusy(true);
    try {
      await saveAttendance(record?._id, record ? { students, version: record.__v, ...(admin ? { reason: reviewReason } : {}) } : { teacherAssignment: selection.teacherAssignment, period: selection.period, attendanceDate: selection.date, students });
      setSaved(true); toast.success('Attendance saved'); onSaved();
    } catch (e) { setPendingStudents(null); setError(apiError(e)); } finally { lock.current = false; setBusy(false); }
  };
  const submit = async event => {
    event.preventDefault(); if (lock.current || readOnly) return;
    setError('');
    let students; try { students = attendancePayload(rows); } catch (e) { setError(e.message); return; }
    if (admin && record) {
      if (!reviewReason.trim()) { setError('Enter a reason for this correction.'); return; }
      setPendingStudents(students);
    } else await persist(students);
  };
  const adminAction = async () => {
    if (lock.current) return;
    if (!reason.trim()) { setActionError('Enter a reason.'); return; }
    lock.current = true; setBusy(true); setActionError('');
    try {
      if (action === 'deactivate') await deactivateAttendance(record._id, { version: record.__v, reason });
      else await changeAttendanceLock(record._id, { version: record.__v, reason, isLocked: action === 'lock' });
      setSaved(true); setAction(''); toast.success('Attendance updated'); onSaved();
    } catch (e) { setActionError(apiError(e)); } finally { lock.current = false; setBusy(false); }
  };
  const openAction = next => leave(() => { setRows(initial); setReviewReason(''); setAction(next); setReason(''); setActionError(''); });
  return <>
    <Modal isOpen title={record ? 'Recorded attendance session' : 'Mark attendance'} onClose={() => leave(onClose)} busy={busy} width="max-w-5xl">
      <div className="space-y-5"><p className="text-sm text-slate-600">{record ? `${assignmentLabel(record.teacherAssignment)} · ${record.attendanceDate.slice(0, 10)} · ${timeLabel(record.period)}` : `${selection.date} · Every row starts Unmarked. Select a status for each student.`}</p>
      {record && <p className="rounded-xl bg-blue-50 p-3 text-sm">{record.isActive === false ? 'Inactive history — read-only. The unique session is reserved; it cannot be recreated.' : record.isLocked ? 'Locked — read-only. Only Admin can unlock with a recorded reason.' : 'Unlocked — corrections require the version you loaded.'}</p>}
      {error && <div role="alert" className="space-y-2 rounded-xl bg-red-50 p-4 text-red-800"><p>{error} Your entries have been preserved.</p><SecondaryButton onClick={() => leave(reload)}>Reload existing session</SecondaryButton></div>}
      <p className="text-sm text-slate-600">Attendance is per student-period. Only Present contributes to the percentage numerator. Missing records are not absence. Existing sessions show their recorded roster; corrections require currently eligible students. Historical enrollment is not reconstructed.</p>
      {feedback && <p role="status" className="text-blue-700">{feedback}</p>}
      <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="min-w-0"><legend className="sr-only">Student attendance statuses</legend>
      {!readOnly && <div className="mb-4 flex flex-wrap gap-2"><SecondaryButton onClick={() => { setRows(prev => prev.map(row => ({ ...row, status: 'Present' }))); setFeedback(`Marked all ${rows.length} students Present. Review and save to record this change.`); }}>Mark all Present</SecondaryButton><SecondaryButton onClick={() => { setRows(prev => prev.map(row => ({ ...row, status: '' }))); setFeedback('All rows are now Unmarked. Nothing has been saved.'); }}>Clear all statuses</SecondaryButton></div>}
      {!readOnly && admin && record && <div className="mb-4"><InputField id="attendance-correction-reason" label="Correction reason" value={reviewReason} maxLength={500} onChange={e => setReviewReason(e.target.value)} /></div>}
      {!rows.length ? <p className="rounded-xl border p-5">No eligible students in this roster. Check enrollment and active accounts.</p> : <div tabIndex={0} role="region" aria-label="Attendance roster" className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50"><tr>{['Student', 'Admission / roll', 'Status', 'Remark'].map(h => <th scope="col" key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => { const name = row.student?.user?.fullname || 'Missing historical student'; return <tr key={row.student?._id || index} className="border-t"><th scope="row" className="p-3 text-left font-medium">{name}</th><td className="p-3">{row.student?.admissionNo || '—'} / {row.student?.rollNumber || '—'}</td><td className="min-w-44 p-3">{readOnly ? row.status : <SelectField id={`attendance-status-${index}`} label={`Status for ${name}`} value={row.status} onChange={e => update(index, 'status', e.target.value)}><option value="">Unmarked</option>{attendanceStatuses.map(status => <option key={status}>{status}</option>)}</SelectField>}</td><td className="min-w-56 p-3">{readOnly ? row.remark || '—' : <InputField id={`attendance-remark-${index}`} label={`Remark for ${name}`} maxLength={500} value={row.remark} onChange={e => update(index, 'remark', e.target.value)} />}</td></tr>; })}</tbody></table></div>}
      </fieldset><div className="flex flex-wrap justify-end gap-3"><SecondaryButton disabled={busy} onClick={() => leave(onClose)}>Close</SecondaryButton>{record && !record.isLocked && record.isActive && !editing && <SecondaryButton onClick={() => setEditing(true)}>Edit recorded statuses</SecondaryButton>}{!readOnly && <PrimaryButton type="submit" disabled={!rows.length} loading={busy}>Save attendance</PrimaryButton>}{admin && record?.isActive && <><SecondaryButton disabled={busy} onClick={() => openAction(record.isLocked ? 'unlock' : 'lock')}>{record.isLocked ? 'Unlock' : 'Lock'}</SecondaryButton>{!record.isLocked && <SecondaryButton disabled={busy} onClick={() => openAction('deactivate')}>Deactivate</SecondaryButton>}</>}</div></form>
      {admin && record?.audit?.length > 0 && <section className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Audit history</h3><ul className="mt-2 space-y-2 text-sm">{record.audit.map((item, i) => <li key={item._id || i}>{item.action} · {new Date(item.at).toLocaleString()} · Actor {idOf(item.actor)} · {item.reason}</li>)}</ul></section>}
      </div>
    </Modal>
    <Modal isOpen={Boolean(action)} title={`${action} attendance`} onClose={() => { if (!busy) setAction(''); }} busy={busy} width="max-w-lg"><div className="space-y-4"><p>Changes are version checked and recorded with your account, time and reason. Deactivation preserves history and does not permit duplicate creation.</p><InputField id="attendance-action-reason" label="Reason" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} disabled={busy} />{actionError && <p role="alert" className="text-red-700">{actionError}</p>}<div className="flex justify-end gap-3"><SecondaryButton disabled={busy} onClick={() => setAction('')}>Cancel</SecondaryButton><PrimaryButton loading={busy} onClick={adminAction}>Confirm {action}</PrimaryButton></div></div></Modal>
    <ConfirmDialog isOpen={blocker.state === 'blocked'} title="Discard unsaved attendance?" message={busy ? 'Please wait for the save to finish before leaving.' : 'Your unsaved attendance changes will be lost.'} confirmLabel="Discard and leave" loading={busy} onConfirm={() => { if (!busy) blocker.proceed(); }} onClose={() => blocker.reset()} />
    <ConfirmDialog isOpen={Boolean(pendingStudents)} title="Confirm attendance correction" message="Replace the recorded statuses with your reviewed entries? Your account, time and correction reason will be recorded. A concurrent change will reject this save." confirmLabel="Save correction" loading={busy} onConfirm={() => persist(pendingStudents)} onClose={() => { if (!busy) setPendingStudents(null); }} />
  </>;
}

export default function AttendanceEditor({ id, options, defaults = {}, onSaved, onClose }) {
  const [selection, setSelection] = useState({ teacherAssignment: defaults.teacherAssignment || '', period: defaults.period || '', date: defaults.date || options.today });
  const [loaded, setLoaded] = useState(null);
  const request = useWorkflow(id ? `attendance/${id}` : 'roster', id ? {} : loaded || {}, Boolean(id || loaded));
  const selectedAssignment = options.assignments.find(a => a._id === selection.teacherAssignment);
  if ((id || loaded) && request.data) return <AttendanceRows key={`${request.data.record?._id || request.data._id || 'new'}:${request.data.record?.__v ?? request.data.__v ?? 0}`} record={id ? request.data : request.data.record} roster={id ? [] : request.data.roster} selection={loaded} onSaved={onSaved} onClose={onClose} reload={request.reload} />;
  return <Modal isOpen title={id ? 'Load attendance session' : 'Choose attendance session'} onClose={onClose} width="max-w-2xl"><div className="space-y-5">{!id && <form onSubmit={e => { e.preventDefault(); setLoaded({ ...selection }); if (JSON.stringify(loaded) === JSON.stringify(selection)) request.reload(); }} className="space-y-4"><p className="text-sm text-slate-600">Select an authorized assignment even if no timetable suggestion exists. Dates follow {options.timeZone}. Loading checks for an existing session before offering creation.</p><SelectField id="mark-assignment" label="Assignment" required value={selection.teacherAssignment} onChange={e => setSelection(s => ({ ...s, teacherAssignment: e.target.value }))}><option value="">Select assignment</option>{options.assignments.filter(a => a.eligible).map(a => <option key={a._id} value={a._id}>{assignmentLabel(a)} · {a.academicYear.name}</option>)}</SelectField><InputField id="mark-date" label="School date" type="date" required value={selection.date} min={selectedAssignment?.academicYear?.startDate?.slice(0, 10)} max={selectedAssignment?.academicYear?.endDate?.slice(0, 10)} onChange={e => setSelection(s => ({ ...s, date: e.target.value }))} /><SelectField id="mark-period" label="Teaching period" required value={selection.period} onChange={e => setSelection(s => ({ ...s, period: e.target.value }))}><option value="">Select period</option>{options.periods.filter(p => p.isActive && !p.isBreak).map(p => <option key={p._id} value={p._id}>{timeLabel(p)}</option>)}</SelectField><PrimaryButton type="submit" loading={request.loading}>Load roster / existing record</PrimaryButton></form>}<RequestState request={request} /></div></Modal>;
}
