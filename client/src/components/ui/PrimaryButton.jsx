const PrimaryButton = ({
  children,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`
                w-full
                rounded-xl
                bg-blue-600
                py-3
                px-3
                text-white
                font-semibold
                transition-all
                duration-300
                hover:bg-blue-700
                hover:shadow-lg
                hover:shadow-blue-500/30
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${className}
            `}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

export default PrimaryButton;
