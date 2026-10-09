import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthState';
import useWorkflow from '../../hooks/useWorkflow';
import PageHeader from '../../components/layout/PageHeader';
import RequestState from '../../components/workflow/RequestState';
import AcademicFilters from '../../components/workflow/AcademicFilters';
import WeeklySchedule from '../../components/workflow/WeeklySchedule';
import ScheduleForm from '../../components/workflow/ScheduleForm';
import SelectField from '../../components/ui/SelectField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import Modal from '../../components/modal/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { days, assignmentLabel, timeLabel, label } from '../../utils/workflow';
import { apiError } from '../../utils/management';
import { saveSchedule, deactivateSchedule } from '../../services/workflowService';
export default function TimetablePage() {
  const { user } = useAuth(), admin = user.role === 'Admin';
  const options = useWorkflow('options');
  const [filters, setFilters] = useState({ status: 'active', day: '', academicYear: '', schoolClass: '', section: '', teacher: '' });
  const list = useWorkflow('timetables', filters);
  const [form, setForm] = useState(null), [detail, setDetail] = useState(null), [confirm, setConfirm] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), lock = useRef(false);
  const saved = () => { setForm(null); list.reload(); options.reload(); toast.success('Timetable saved'); };
  const action = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { if (confirm.isActive) await deactivateSchedule(confirm._id); else await saveSchedule(confirm._id, {}); setConfirm(null); list.reload(); toast.success('Timetable updated'); }
    catch (e) { setError(apiError(e)); } finally { lock.current = false; setBusy(false); }
  };
  const actions = record => <div className="flex flex-wrap gap-2"><SecondaryButton onClick={() => setDetail(record)}>Details</SecondaryButton>{admin && <><SecondaryButton disabled={options.loading || Boolean(options.error)} onClick={() => setForm({ record })}>Edit</SecondaryButton><SecondaryButton onClick={() => { setError(''); setConfirm(record); }}>{record.isActive ? 'Deactivate' : 'Restore'}</SecondaryButton></>}</div>;
  return <div className="space-y-5"><PageHeader title={admin ? 'Timetable management' : 'My timetable'} subtitle="Recurring weekly lessons and reference breaks" /><RequestState request={options}>{options.data && <>{user.role === "Student" && (!options.data.placement?.schoolClass?.isActive || !options.data.placement?.section?.isActive) && <p role="status" className="rounded-xl bg-amber-50 p-4 text-amber-900">Your current class or section is missing or inactive. Ask Admin to review your enrollment. Historical attendance remains available in My attendance.</p>}<section aria-label="Timetable filters" className="grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">{user.role !== 'Student' && <AcademicFilters assignments={options.data.assignments} values={filters} onChange={setFilters} includeTeacher={admin} />}<SelectField id="timetable-day" label="Day" value={filters.day} onChange={e => setFilters(f => ({ ...f, day: e.target.value }))}><option value="">All days</option>{days.map(day => <option key={day}>{day}</option>)}</SelectField>{admin && <SelectField id="timetable-status" label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All</option></SelectField>}<div className="flex items-end gap-2"><SecondaryButton onClick={() => setFilters({ status: 'active', day: '', academicYear: '', schoolClass: '', section: '', teacher: '' })}>Reset filters</SecondaryButton><SecondaryButton onClick={() => { list.reload(); options.reload(); }}>Refresh</SecondaryButton></div></section>{admin && <PrimaryButton className="sm:w-auto" onClick={() => setForm({ record: null })}>Add timetable booking</PrimaryButton>}<RequestState request={list}>{list.data && <WeeklySchedule records={list.data.records} periods={options.data.periods} actions={actions} />}</RequestState></>}</RequestState>
    <Modal isOpen={Boolean(form)} title={form?.record ? 'Edit timetable booking' : 'Create timetable booking'} onClose={() => { if (!busy) setForm(null); }} busy={busy} width="max-w-3xl">{form && options.data && <ScheduleForm record={form.record} options={options.data} onSaved={saved} onBusy={setBusy} onCancel={() => setForm(null)} />}</Modal>
    <Modal isOpen={Boolean(detail)} title="Timetable details" onClose={() => setDetail(null)} width="max-w-2xl">{detail && <dl className="space-y-4 text-slate-800">{[['Academic year', label(detail.academicYear)], ['Assignment', assignmentLabel(detail.teacherAssignment)], ['Day', detail.day], ['Period', timeLabel(detail.period)], ['Room', detail.roomNumber || 'Not specified'], ['Status', detail.isActive ? 'Active' : 'Inactive']].map(([key, value]) => <div key={key}><dt className="text-sm text-slate-500">{key}</dt><dd>{value}</dd></div>)}</dl>}</Modal>
    <ConfirmDialog isOpen={Boolean(confirm)} title={confirm?.isActive ? 'Deactivate booking' : 'Restore booking'} message="Historical attendance remains unchanged. Restoration checks academic eligibility and interval conflicts again." confirmLabel={confirm?.isActive ? 'Deactivate' : 'Restore'} onConfirm={action} onClose={() => { if (!busy) setConfirm(null); }} loading={busy} error={error} />
  </div>;
}
