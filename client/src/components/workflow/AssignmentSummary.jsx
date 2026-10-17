import { publicationTime } from '../../utils/publication';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthState';
import useApiList from '../../hooks/useApiList';
import RequestState from './RequestState';
export default function AssignmentSummary() {
  const { user } = useAuth(), student = user.role === 'Student', request = useApiList('/assignments', { limit: 1 });
  const s = request.data?.summary;
  return <section className="rounded-2xl border bg-white p-5"><div className="mb-3 flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">Assignments</h2><Link className="text-blue-700 underline" to={`/${user.role.toLowerCase()}/assignments`}>Open assignments</Link></div><RequestState request={request}>{s && <><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(student ? [['Upcoming deadlines', s.upcoming], ['Not submitted', s.notSubmitted], ['Returned for revision', s.returned], ['Unread published feedback', s.newFeedback]] : [['Upcoming deadlines', s.upcoming], ['Pending evaluations', s.pending], ['Returned for revision', s.returned], ['Resubmitted, awaiting review', s.resubmitted]]).map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-semibold">{count || 0}</p><p className="text-sm">{label}</p></div>)}</div><ul className="mt-4 space-y-2">{request.data.upcoming.map(r => <li key={r._id} className="text-sm"><Link className="text-blue-700 underline" to={`/${user.role.toLowerCase()}/assignments`}>{r.title}</Link> ? Due {publicationTime(r.dueAt, request.data.timeZone)}</li>)}</ul><p className="mt-3 text-xs text-slate-600">Counts cover your authorized assignments and latest submission versions. Missing work is not treated as a zero grade.</p></>}</RequestState></section>;
}
