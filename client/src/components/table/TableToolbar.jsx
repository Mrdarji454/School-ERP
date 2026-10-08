import SearchInput from "../ui/SearchInput";
import PrimaryButton from "../ui/PrimaryButton";

const TableToolbar = ({
  search,
  setSearch,
  onAdd,
  addButtonText = "Add",
  children,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />

        {children}
      </div>

      <PrimaryButton onClick={onAdd} className="w-full md:w-auto">
        + {addButtonText}
      </PrimaryButton>
    </div>
  );
};

export default TableToolbar;
