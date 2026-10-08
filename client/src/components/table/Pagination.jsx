import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex text-slate-700 items-center gap-2 rounded-lg border px-4 py-2 disabled:opacity-50"
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      <span className="font-medium text-slate-700">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex  text-slate-700 items-center gap-2 rounded-lg border px-4 py-2 disabled:opacity-50"
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
