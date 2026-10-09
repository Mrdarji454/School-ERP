import { forwardRef } from "react";

const InputField = forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label htmlFor={props.id || props.name} className="text-sm font-medium text-slate-800">{label}</label>

        <input
          ref={ref}
          id={props.id || props.name}
          {...props}
          className={`
                        w-full
                        rounded-xl
                        border
                        px-4
                        py-3
                        outline-none
                        transition
                        text-black
                        ${
                          error
                            ? "border-red-500 focus:ring-red-200"
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                        }

                        focus:ring-4
                        ${className}
                    `}
        />

        {error && <p id={`${props.id || props.name}-error`} className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
