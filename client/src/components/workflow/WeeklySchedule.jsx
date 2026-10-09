import { useState } from 'react';
import DataTable from '../table/DataTable';
import SecondaryButton from '../ui/SecondaryButton';
import { days, assignmentLabel, timeLabel, idOf } from '../../utils/workflow';
export default function WeeklySchedule({ records, periods = [], actions }) {
  const [view, setView] = useState('grid');
  const rows = [...records].sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || (a.period?.startTime || '').localeCompare(b.period?.startTime || ''));
  const columns = [{ header: 'Day', accessor: 'day' }, { header: 'Period', render: r => timeLabel(r.period) }, { header: 'Class / subject / teacher', render: r => assignmentLabel(r.teacherAssignment) }, { header: 'Room', render: r => r.roomNumber || 'Not specified' }, { header: 'Status', render: r => r.isActive ? 'Active' : 'Inactive' }, ...(actions ? [{ header: 'Actions', render: actions }] : [])];
  const gridPeriods = [...new Map([...periods.filter(p => p.isActive && p.isBreak), ...rows.map(r => r.period).filter(Boolean)].map(p => [p._id, p])).values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return <div className="space-y-4"><div className="hidden gap-2 md:flex"><SecondaryButton aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Weekly grid</SecondaryButton><SecondaryButton aria-pressed={view === 'list'} onClick={() => setView('list')}>List view</SecondaryButton></div>
    {!rows.length && <p className="rounded-xl border bg-white p-5 text-slate-600">No timetable bookings match these filters. Missing bookings do not mean absence.</p>}
    {periods.some(p => p.isActive && p.isBreak) && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Reference breaks: {periods.filter(p => p.isActive && p.isBreak).map(timeLabel).join('; ')}</p>}
    <div className={view === 'grid' ? 'md:hidden' : ''}><DataTable columns={columns} data={rows} emptyMessage="No timetable bookings" /></div>
    {view === 'grid' && rows.length > 0 && <div tabIndex={0} role="region" aria-label="Weekly timetable grid" className="hidden overflow-x-auto rounded-2xl border bg-white md:block"><table className="w-full min-w-[1100px] text-sm"><caption className="p-4 text-left text-slate-600">Recurring weekly bookings; breaks are reference periods, not attendance tasks.</caption><thead><tr><th scope="col" className="border p-3">Period</th>{days.map(day => <th scope="col" key={day} className="border p-3">{day}</th>)}</tr></thead><tbody>{gridPeriods.map(period => <tr key={period._id}><th scope="row" className="border bg-slate-50 p-3 text-left">{timeLabel(period)}</th>{days.map(day => <td key={day} className="min-w-40 border p-2 align-top">{period.isBreak ? <span className="text-slate-500">Break</span> : rows.filter(r => r.day === day && idOf(r.period) === period._id).map(r => <div key={r._id} className="mb-2 space-y-2 rounded-lg bg-blue-50 p-3"><p>{assignmentLabel(r.teacherAssignment)}</p><p className="text-slate-600">Room: {r.roomNumber || 'Not specified'} · {r.isActive ? 'Active' : 'Inactive'}</p>{actions?.(r)}</div>)}</td>)}</tr>)}</tbody></table></div>}
  </div>;
}
