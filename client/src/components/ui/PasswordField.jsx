import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordField = forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>

        <div className="relative">
          <input
            ref={ref}
            {...props}
            type={show ? "text" : "password"}
            className={`
                            w-full
                            rounded-xl
                            border
                            px-4
                            py-3
                            pr-12
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

          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";

export default PasswordField;
