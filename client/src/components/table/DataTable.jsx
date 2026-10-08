import EmptyState from "../ui/EmptyState";
import LoadingSpinner from "../ui/LoadingSpinner";

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data found",
}) => {
  <div className="relative min-h-[600px] overflow-hidden rounded-2xl bg-white shadow">
    {loading && (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
        <LoadingSpinner />
      </div>
    )}

    <div className="overflow-x-auto">
      <table className="min-w-full">
        ... // your existing thead // your existing tbody
      </table>
    </div>
  </div>;

  {
    !loading && data.length === 0 ? (
      <div className="flex min-h-[500px] items-center justify-center">
        <EmptyState title={emptyMessage} />
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Existing thead */}
          {/* Existing tbody */}
        </table>
      </div>
    );
  }
  return (
    <div className="min-h-70 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor || column.header}
                  className="px-6 py-4 text-left text-sm font-semibold text-black"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr
                key={row._id || index}
                className="border-t transition duration-200 hover:bg-blue-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.accessor || column.header}
                    className="px-6 text-black py-4"
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
