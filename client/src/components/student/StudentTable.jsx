import DataTable from "../table/DataTable";
import studentColumns from "./StudetColumns.jsx";

const StudentTable = ({
  students = [],
  loading = false,

  onView,
  onEdit,
  onDelete,
  onRestore,
}) => {
  return (
    <DataTable
      columns={studentColumns({
        onView,
        onEdit,
        onDelete,
  onRestore,
      })}
      data={students}
      loading={loading}
      emptyMessage="No Students Found"
    />
  );
};

export default StudentTable;
