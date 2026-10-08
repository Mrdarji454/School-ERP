const styles = {
  Active: "bg-emerald-100 text-emerald-800",
  Inactive: "bg-rose-100 text-rose-800",
  Pending: "bg-amber-100 text-amber-800",
  Paid: "bg-emerald-100 text-emerald-800",
  Unpaid: "bg-rose-100 text-rose-800",
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
