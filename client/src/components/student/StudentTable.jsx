import DataTable from "../table/DataTable";
import studentColumns from "./StudetColumns.jsx";

const StudentTable = ({
  students = [],
  loading = false,

  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <DataTable
      columns={studentColumns({
        onView,
        onEdit,
        onDelete,
      })}
      data={students}
      loading={loading}
      emptyMessage="No Students Found"
    />
  );
};

export default StudentTable;
