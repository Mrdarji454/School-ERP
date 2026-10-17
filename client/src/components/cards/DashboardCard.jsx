const DashboardCard = ({ title, subtitle, action, children, className = "" }) => {
  return (
    <div
      className={`erp-dashboard-card min-w-0 rounded-2xl bg-white p-6 shadow border border-slate-200 ${className}`}>
      {title && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}</div>{action}</div>
      )}

      {children}
    </div>
  );
};

export default DashboardCard;
