const DashboardCard = ({ title, children, className = "" }) => {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow border border-slate-200 ${className}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      )}

      {children}
    </div>
  );
};

export default DashboardCard;
