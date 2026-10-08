import SearchInput from "../ui/SearchInput";
import SelectField from "../ui/SelectField";
import PrimaryButton from "../ui/PrimaryButton";
import SecondaryButton from "../ui/SecondaryButton";

const StudentFilters = ({
  search,
  setSearch,

  academicYears = [],
  selectedAcademicYear,
  setSelectedAcademicYear,

  classes = [],
  selectedClass,
  setSelectedClass,

  sections = [],
  selectedSection,
  setSelectedSection,

  status,
  setStatus,

  onReset,
  onImport,
  onExport,
  onAdd,
}) => {
  return (
    <div className="mb-6 rounded-2xl bg-white p-5 shadow">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student..."
        />

        {/* Academic Year */}
        <SelectField
          value={selectedAcademicYear}
          onChange={(e) => setSelectedAcademicYear(e.target.value)}
        >
          <option value="">Academic Year</option>

          {academicYears.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </SelectField>

        {/* Class */}
        <SelectField
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Class</option>

          {classes.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </SelectField>

        {/* Section */}
        <SelectField
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
        >
          <option value="">Section</option>

          {sections.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </SelectField>

        {/* Status */}
        <SelectField value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </SelectField>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <SecondaryButton type="button" onClick={onReset}>
          Reset
        </SecondaryButton>

        <SecondaryButton type="button" onClick={onImport}>
          Import
        </SecondaryButton>

        <SecondaryButton type="button" onClick={onExport}>
          Export
        </SecondaryButton>

        <PrimaryButton type="button" onClick={onAdd}>
          + Add Student
        </PrimaryButton>
      </div>
    </div>
  );
};

export default StudentFilters;
