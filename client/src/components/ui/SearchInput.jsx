import { Search } from "lucide-react";

const SearchInput = ({ className = "", ...props }) => {
  return (
    <div className={`relative w-full md:w-80 ${className}`}>
      <Search
        size={18}
        className="absolute  left-3 top-1/2 -translate-y-1/2 text-slate-700"
      />

      <input
        {...props}
        className="w-full text-black rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
      />
    </div>
  );
};

export default SearchInput;
