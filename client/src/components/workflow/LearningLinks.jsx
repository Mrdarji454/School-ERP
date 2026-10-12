import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthState';
import useApiList from '../../hooks/useApiList';
import RequestState from './RequestState';
export default function LearningLinks() {
  const { user } = useAuth(), request = useApiList('/resources/summary');
  return <section aria-label="Learning and school updates" className="my-5"><RequestState request={request}>{request.data && <div className="grid gap-3 sm:grid-cols-3">{[['resources', user.role === 'Teacher' ? 'My resources' : 'Learning resources'], ['notices', 'Published notices'], ['calendar', 'Upcoming calendar entries']].map(([key, title]) => <Link key={key} to={`/${user.role.toLowerCase()}/${key}`} className="rounded-2xl border bg-white p-5 hover:border-blue-500 focus-visible:outline-2"><p className="text-sm text-slate-600">{title}</p><p className="mt-1 text-2xl font-semibold text-blue-800">{request.data[key]}</p></Link>)}</div>}</RequestState></section>;
}
