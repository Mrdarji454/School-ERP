import EmptyState from "../ui/EmptyState";
import LoadingSpinner from "../ui/LoadingSpinner";
const DataTable = ({ columns = [], data = [], loading = false, emptyMessage = "No data found", mobileRender }) => (
 <><div className={`min-h-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm${mobileRender && data.length && !loading ? ' academic-desktop-table' : ''}`} aria-busy={loading}>
  {loading ? <div role="status" className="flex min-h-48 items-center justify-center gap-3"><LoadingSpinner /><span className="text-slate-600">Loading records...</span></div> : !data.length ? <div className="flex min-h-48 items-center justify-center p-6"><EmptyState title={emptyMessage} /></div> :
  <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Records table"><table className="min-w-full">
   <thead className="bg-slate-100"><tr>{columns.map(column => <th scope="col" key={column.accessor || column.header} className="px-4 py-4 text-left text-sm font-semibold text-slate-900 sm:px-6">{column.header}</th>)}</tr></thead>
   <tbody>{data.map((row, index) => <tr key={row._id || index} className="border-t transition hover:bg-blue-50">{columns.map(column => <td key={column.accessor || column.header} className="px-4 py-4 text-sm text-slate-800 sm:px-6">{column.render ? column.render(row) : row[column.accessor]}</td>)}</tr>)}</tbody>
  </table></div>}
 </div>{mobileRender && !loading && Boolean(data.length) && <div className="academic-mobile-records">{data.map((row, index) => <div key={row._id || index}>{mobileRender(row)}</div>)}</div>}</>
);
export default DataTable;
