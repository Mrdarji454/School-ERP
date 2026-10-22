import { useState } from 'react';
import { useAuth } from '../../context/AuthState';
import useApiList from '../../hooks/useApiList';
import useUnsavedAttendance from '../../hooks/useUnsavedAttendance';
import PageHeader from '../../components/layout/PageHeader';
import RequestState from '../../components/workflow/RequestState';
import ExamForm from '../../components/workflow/ExamForm';
import ExamWork from '../../components/workflow/ExamWork';
import InputField from '../../components/ui/InputField';
import SelectField from '../../components/ui/SelectField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import Modal from '../../components/modal/Modal';
import Pagination from '../../components/table/Pagination';
function Detail({ selected, ...props }) {
  const request = useApiList(`/exams/${selected}`);
  return <RequestState skeleton request={request}>{request.data && <ExamWork key={request.data.revision} exam={request.data} {...props} onSaved={() => { request.reload(); props.onChanged(); }} />}</RequestState>;
}
export default function ExamsPage() {
  const { user } = useAuth(), admin = user.role === 'Admin';
  const [filters, setFilters] = useState({ search: '', academicYear: '', state: '', page: 1 });
  const options = useApiList(admin ? '/exams/options' : '/resources/options'), list = useApiList('/exams', filters);
  const [selected, setSelected] = useState(''), [form, setForm] = useState(null), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const blocker = useUnsavedAttendance(dirty, busy, 'exam work');
  const close = () => { if (!busy && (!dirty || window.confirm('Discard unsaved exam work?'))) { setDirty(false); setSelected(''); setForm(null); } };
  const change = (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 }));
  return <div className="space-y-5"><PageHeader title={admin ? 'Exams and results review' : user.role === 'Teacher' ? 'My exam duties' : 'My exam schedule'} subtitle="Exam schedules, recorded candidates and separately reviewed results." /><RequestState skeleton request={options}>{options.data && <>{admin && <PrimaryButton onClick={() => setForm({ record: null })}>Create exam</PrimaryButton>}<div className="grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-3"><InputField id="exam-search" label="Search exams" value={filters.search} onChange={e => change('search', e.target.value)} /><SelectField id="exam-year-filter" label="Academic year" value={filters.academicYear} onChange={e => change('academicYear', e.target.value)}><option value="">All years</option>{(list.data?.years || options.data.years || []).map(y => <option key={y._id} value={y._id}>{y.name}</option>)}</SelectField><SelectField id="exam-state" label="Workflow state" value={filters.state} onChange={e => change('state', e.target.value)}><option value="">All states</option>{['draft', 'open-for-entry', 'submitted-for-review', 'approved', 'published', 'archived'].map(s => <option key={s}>{s}</option>)}</SelectField></div><RequestState skeleton request={list}>{list.data && <><div className="grid gap-4 md:grid-cols-2">{list.data.records.map(e => <article key={e._id} className="min-w-0 space-y-3 rounded-xl border bg-white p-5"><h2 className="break-words text-lg font-semibold">{e.name}</h2><p>{e.state}</p><p>{e.startDate.slice(0, 10)} to {e.endDate.slice(0, 10)}</p><SecondaryButton onClick={() => setSelected(e._id)}>Open exam</SecondaryButton></article>)}</div>{!list.data.records.length && <p>No exams match your filters.</p>}<Pagination page={list.data.pagination.page} totalPages={list.data.pagination.totalPages} onPageChange={page => setFilters(f => ({ ...f, page }))} /></>}</RequestState></>}</RequestState><Modal isOpen={Boolean(selected || form)} title={form ? 'Exam setup' : 'Exam workspace'} onClose={close} busy={busy} width="max-w-6xl"><fieldset disabled={busy} className="min-w-0">{options.data && (form ? <ExamForm record={form.record} options={options.data} onDirty={setDirty} onBusy={setBusy} onSaved={() => { setDirty(false); setForm(null); setSelected(''); list.reload(); }} /> : selected && <Detail selected={selected} role={user.role} options={options.data} dirty={dirty} onDirty={setDirty} onBusy={setBusy} onChanged={list.reload} onEdit={record => setForm({ record })} />)}</fieldset></Modal><Modal isOpen={blocker.state === 'blocked'} title="Unsaved exam work" onClose={() => blocker.reset?.()} busy={busy}><p>Leave and discard unsaved work?</p><SecondaryButton onClick={() => blocker.reset?.()}>Keep working</SecondaryButton><SecondaryButton disabled={busy} onClick={() => blocker.proceed?.()}>Discard and leave</SecondaryButton></Modal></div>;
}
