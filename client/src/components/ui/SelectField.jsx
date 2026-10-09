import { forwardRef } from "react";

const SelectField = forwardRef(({ label, error, children, ...props }, ref) => {
  return (
    <div className="space-y-2">
      <label htmlFor={props.id || props.name} className="text-sm font-medium text-slate-800">{label}</label>

      <select
        ref={ref}
        id={props.id || props.name}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none focus:ring-4 ${
          error
            ? "border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
        }`}
      >
        {children}
      </select>

      {error && <p id={`${props.id || props.name}-error`} className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

SelectField.displayName = "SelectField";

export default SelectField;
