import SecondaryButton from '../ui/SecondaryButton';
export default function RequestState({ request, children, skeleton = false }) {
  if (request.loading && skeleton) return <div role="status" aria-label="Loading dashboard data" className="admin-skeleton"><span className="sr-only">Loading dashboard data...</span><span /><span /><span /></div>;
  if (request.loading) return <p role="status" className="rounded-xl bg-white p-6 text-slate-700">Loading…</p>;
  if (request.error) return <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-5 text-red-800"><p>{request.error}</p><SecondaryButton onClick={request.reload}>Retry</SecondaryButton></div>;
  return children;
}
