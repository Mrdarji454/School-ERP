import ExamSummary from '../../components/workflow/ExamSummary';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, Building2, BookOpen, CalendarDays, UserPlus, ClipboardCheck, ArrowRight, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthState';
import { useAcademicScope } from '../../context/AcademicScopeState';
import useApiList from '../../hooks/useApiList';
import useSchoolClock from '../../hooks/useSchoolClock';
import { dashboardYear, attendanceChoices, attendancePercent, timetablePreview, scopedFees } from '../../utils/adminDashboard';
import { publicationLabel, publicationTime } from '../../utils/publication';
import StatCard from '../../components/cards/StatCard';
import DashboardCard from '../../components/cards/DashboardCard';
import RequestState from '../../components/workflow/RequestState';
import SelectField from '../../components/ui/SelectField';
import InputField from '../../components/ui/InputField';
import SecondaryButton from '../../components/ui/SecondaryButton';
import DataTable from '../../components/table/DataTable';
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
const action = (to, text = 'View all') => <Link className="admin-card-link" to={to}>{text}</Link>;
const empty = text => <p className="admin-empty">{text}</p>;

function AttendanceOverview({ year, scope, clock }) {
  const [filters, setFilters] = useState({ date: '', schoolClass: '', section: '' });
  const available = attendanceChoices(scope.options, year, filters.schoolClass);
  const schoolClass = available.classes.some(c => c._id === filters.schoolClass) ? filters.schoolClass : '';
  const section = schoolClass && available.sections.some(s => s._id === filters.section) ? filters.section : '';
  const request = useApiList('/workflow/attendance', { academicYear: year, date: filters.date || clock.today, schoolClass, section, status: 'active', limit: 1 });
  const summary = request.data?.summary, percent = attendancePercent(summary);
  const statuses = [['present', 'Present', '#217a52'], ['absent', 'Absent', '#b42318'], ['late', 'Late', '#94700b'], ['halfDay', 'Half Day', '#36769c'], ['leave', 'Leave', '#64748b']];
  return <DashboardCard title="Attendance overview" subtitle="Student attendance across recorded periods" action={action('/admin/attendance', 'Review attendance')}>
    <div className="admin-filter-row"><InputField id="overview-date" type="date" label="School date" value={filters.date || clock.today} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} /><SelectField id="overview-class" label="Class" value={schoolClass} onChange={e => setFilters(f => ({ ...f, schoolClass: e.target.value, section: '' }))}><option value="">All eligible classes</option>{available.classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</SelectField><SelectField id="overview-section" label="Section" disabled={!schoolClass} value={section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))}><option value="">All eligible sections</option>{available.sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</SelectField></div>
    <RequestState request={request} skeleton>{summary && <><div className="admin-attendance-content"><div><div className="admin-attendance-ring" style={{ background: `conic-gradient(#217a52 0 ${percent ?? 0}%, #edf1f4 ${percent ?? 0}% 100%)` }}><div><strong>{percent === null ? '--' : `${percent}%`}</strong><span>{percent === null ? 'No recorded entries' : 'Present'}</span></div></div><p className="mt-3 text-center text-xs text-slate-600">{summary.total} recorded student-periods</p></div><div className="admin-attendance-bars">{statuses.map(([key, label, color]) => <div key={key} className="admin-attendance-bar"><span>{label}</span><div aria-hidden="true"><i style={{ background: color, width: `${summary.total ? summary[key] / summary.total * 100 : 0}%` }} /></div><strong>{summary[key]}</strong></div>)}</div></div><p className="admin-policy">Present entries / all recorded student-period entries. Late, Half Day and Leave remain separate statuses. Missing sessions do not imply absence.</p></>}</RequestState>
  </DashboardCard>;
}
function TimetableOverview({ year, scope, clock }) {
  const request = useApiList('/workflow/timetables', { academicYear: year, day: clock.day, status: 'active' });
  const preview = request.data ? timetablePreview(request.data.records, scope.workflow.assignments, year, clock.day, clock.today) : null;
  const columns = [{ header: 'Time', render: r => `${r.period.startTime} - ${r.period.endTime}` }, { header: 'Class / Section', render: r => `${r.teacherAssignment.schoolClass?.name} / ${r.teacherAssignment.section?.name}` }, { header: 'Subject', render: r => r.teacherAssignment.subject?.name }, { header: 'Teacher', render: r => r.teacherAssignment.teacher?.user?.fullname || 'Unavailable' }, { header: 'Room', render: r => r.roomNumber || 'Not assigned' }];
  return <DashboardCard title="Today's timetable" subtitle={`${clock.day}, ${clock.today} / ${scope.workflow.timeZone}`} action={action('/admin/timetable', 'Full timetable')}><RequestState request={request} skeleton>{preview && <><p className="mb-3 text-xs text-slate-600">Preview: showing {preview.records.length} of {preview.total} eligible lessons today.</p><DataTable columns={columns} data={preview.records} emptyMessage="No eligible lessons scheduled today in this academic year." /></>}</RequestState></DashboardCard>;
}
function CommunicationsOverview({ year, clock, zone }) {
  const notices = useApiList('/communications/notices', { status: 'published', limit: 4 });
  const calendar = useApiList('/communications/calendar', { academicYear: year, status: 'active', from: clock.today, limit: 4 });
  return <div className="admin-split-grid"><DashboardCard title="Notices" subtitle="Currently published / school-wide Admin oversight" action={action('/admin/notices')}><RequestState request={notices} skeleton>{notices.data && <>{notices.data.records.map(n => <article className="admin-entry" key={n._id}><div className="flex flex-wrap gap-2"><span className="admin-badge">{n.audience || 'Everyone'}</span><span className="admin-badge gold">{n.priority}</span></div><h3>{n.title}</h3><p className="line-clamp-2">{n.message}</p><p className="mt-2">{publicationTime(n.publishDate, zone)}</p></article>)}{!notices.data.records.length && empty('No published notices.')}<p className="mt-3 text-xs text-slate-600">Showing {notices.data.records.length} of {notices.data.pagination.total}. Notices are not academic-year scoped.</p></>}</RequestState></DashboardCard>
    <DashboardCard title="Upcoming calendar" subtitle="Selected academic year / ongoing and upcoming events" action={action('/admin/calendar')}><RequestState request={calendar} skeleton>{calendar.data && <>{calendar.data.records.map(e => <article className="admin-entry admin-event" key={e._id}><time className="admin-event-date" dateTime={e.startDate.slice(0, 10)}>{e.startDate.slice(5, 10)}</time><div><span className="admin-badge">{e.type}</span><h3>{e.title}</h3><p>{e.startDate.slice(0, 10)} to {e.endDate.slice(0, 10)}</p></div></article>)}{!calendar.data.records.length && empty('No ongoing or upcoming calendar entries.')}<p className="mt-3 text-xs text-slate-600">Showing {calendar.data.records.length} of {calendar.data.pagination.total}. Events do not change attendance or timetable bookings.</p></>}</RequestState></DashboardCard></div>;
}
function ScopedDashboard({ year, scope, clock }) {
  const dashboard = useApiList('/dashboard/admin', { academicYear: year });
  const resources = useApiList('/resources', { academicYear: year, limit: 4 });
  const data = dashboard.data, fees = scopedFees(data, year);
  const activeSections = scope.options.sections.filter(s => s.eligible && scope.options.classes.some(c => c.eligible && c._id === s.schoolClass && c.academicYear === year)).length;
  const quickActions = [['/admin/students?action=create', 'Add Student', GraduationCap], ['/admin/teachers?action=create', 'Add Teacher', UserPlus], ['/admin/attendance', 'Review attendance', ClipboardCheck], ['/admin/resources', 'Manage PDF resources', BookOpen], ['/admin/notices', 'Manage notices', Bell]];
  const columns = [{ header: 'Resource', render: r => <div><strong>{r.title}</strong><p className="mt-1 text-xs text-slate-600">{r.schoolClass?.name} / {r.subject?.name}</p></div> }, { header: 'Type / format', render: r => <>{r.type}<p className="text-xs text-slate-600">PDF</p></> }, { header: 'Publication', render: r => <><span className="admin-badge">{publicationLabel(r)}</span><p className="mt-1 text-xs text-slate-600">{publicationTime(r.publishAt, scope.workflow.timeZone)}</p></> }];
  return <><div className="admin-summary"><div className="contents"><RequestState request={dashboard} skeleton>{data && <><StatCard title="Active Students" value={data.statistics.totalStudents} detail="Current placements in this year" icon={GraduationCap} /><StatCard title="Active Teachers" value={data.statistics.totalTeachers} detail="Assigned in this academic year" icon={Users} /><StatCard title="Classes / Sections" value={`${data.statistics.totalClasses} / ${activeSections}`} detail="Active academic structure" icon={Building2} /></>}</RequestState></div><RequestState request={resources} skeleton>{resources.data && <StatCard title="Learning resources" value={resources.data.pagination.total} detail="Selected year / all publication states" icon={BookOpen} />}</RequestState></div>
    <div className="admin-dashboard-grid"><AttendanceOverview year={year} scope={scope} clock={clock} /><DashboardCard title="Quick actions" subtitle="Open existing management workflows"><div className="admin-actions">{quickActions.map(([to, title, Icon]) => <Link key={to} to={to}><Icon aria-hidden="true" /><span>{title}</span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div></DashboardCard></div>
    <ExamSummary academicYear={year} /><TimetableOverview year={year} scope={scope} clock={clock} /><CommunicationsOverview year={year} clock={clock} zone={scope.workflow.timeZone} />
    <div className="admin-dashboard-grid"><DashboardCard title="Learning resources" subtitle="Latest resources / selected academic year" action={action('/admin/resources', 'Manage resources')}><RequestState request={resources} skeleton>{resources.data && <><DataTable columns={columns} data={resources.data.records} emptyMessage="No resources in this academic year." /><p className="mt-3 text-xs text-slate-600">Showing {resources.data.records.length} of {resources.data.pagination.total}. Private PDFs open through the authorized resource library.</p></>}</RequestState></DashboardCard>
    <DashboardCard title="Fee collection" subtitle="Fee structures linked to the selected academic year"><RequestState request={dashboard} skeleton>{data && (fees === null ? empty('A consistent academic-year total is unavailable.') : <><p className="text-xs text-slate-600">Collected / non-reversed payments</p><p className="admin-finance-value">{money(fees)}</p><p className="admin-finance-note">{data.statistics.currentAcademicYear.name}. No target or collection percentage is inferred.</p><h3 className="mt-5 text-sm font-semibold">Recent payments preview</h3>{data.recentPayments.map(p => <div key={p._id} className="admin-entry"><strong>{money(p.amount)}</strong><p>{p.paymentMethod} / {publicationTime(p.paymentDate, scope.workflow.timeZone)}</p></div>)}{!data.recentPayments.length && empty('No recorded fee payments.')}<Link className="admin-card-link" to={`/admin/fees?academicYear=${year}`}>Fees, receipts and reports</Link><Link className="admin-card-link ml-3" to="/admin/salaries">Salary management</Link><p className="admin-finance-note mt-3">Salary and outstanding totals are not shown because the available response does not establish a matching scope.</p></>)}</RequestState></DashboardCard></div>
  </>;
}
export default function Dashboard() {
  const scope = useAcademicScope(), { user } = useAuth(), clock = useSchoolClock(scope.workflow?.timeZone), year = dashboardYear(scope);
  const eligibleYear = scope.options.years.some(y => y._id === year && y.isActive);
  const refresh = scope.refreshOptions;
  const request = { loading: scope.loading || scope.workflowRequest.loading, error: scope.error || scope.workflowRequest.error, reload: refresh };
  return <><div className="admin-welcome"><div><h1>{clock ? clock.greeting : 'Welcome'}, {user?.fullname}</h1><p>Your school overview for the selected academic year.</p></div>{clock && <p className="admin-date-label"><CalendarDays size={17} aria-hidden="true" />{clock.label}</p>}<SecondaryButton aria-label="Refresh dashboard and academic options" onClick={refresh}><RefreshCw size={16} /></SecondaryButton></div><RequestState request={request} skeleton>{clock && (eligibleYear ? <ScopedDashboard key={year} year={year} scope={scope} clock={clock} /> : empty('Choose an active academic year in the header to load the dashboard.'))}</RequestState></>;
}
