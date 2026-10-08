import { Inbox } from "lucide-react";

const EmptyState = ({ title = "No Data Found", description = "" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-100 p-5">
        <Inbox size={42} className="text-slate-700" />
      </div>

      <h3 className="mt-5 text-xl font-semibold text-slate-800">{title}</h3>

      {description && <p className="mt-2 text-slate-700">{description}</p>}
    </div>
  );
};

export default EmptyState;
