const SecondaryButton = ({ children, className = "", ...props }) => {
  return (
    <button
      type="button"
      {...props}
      className={`erp-secondary rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-900 ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
