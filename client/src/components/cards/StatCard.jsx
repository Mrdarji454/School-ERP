const StatCard = ({ title, value, detail, icon: Icon, color = "bg-blue-600" }) => {
  return (
    <div className="erp-stat rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
          {detail && <p className="mt-1 text-xs text-slate-600">{detail}</p>}
        </div>

        {Icon && (
          <div
            className={`erp-stat-icon flex h-14 w-14 items-center justify-center rounded-xl text-black ${color}`}
          >
            <Icon size={28} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
