import { useEffect, useState } from "react";

import PageHeader from "../../../components/layout/PageHeader";
import Pagination from "../../../components/table/Pagination";
import FormModal from "../../../components/modal/FormModal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import StudentTable from "../../../components/student/StudentTable";
import StudentForm from "../../../components/student/StudentForm";
import StudentStats from "../../../components/student/StudentStats";
import StudentFilters from "../../../components/student/StudentFilters";
import StudentDetailsDrawer from "../../../components/student/StudentDetailsDrawer";
import StudentImportModal from "../../../components/student/StudentImportModal";
import ImportSummaryModal from "../../../components/student/ImportSummaryModal";

import useStudents from "../../../hooks/useStudents";
import useClasses from "../../../hooks/useClasses";
import useSections from "../../../hooks/useSection";

const Students = () => {
  const {
    students,
    loading,
    pagination,
    fetchStudents,
    addStudent,
    editStudent,
    removeStudent,
    downloadStudents,
    importStudentExcel,
  } = useStudents();

  const { classes } = useClasses();
  const { sections } = useSections();

  const [search, setSearch] = useState("");

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [status, setStatus] = useState("");

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    fetchStudents({
      page: pagination.page,
      search,
      schoolClass: selectedClass,
      section: selectedSection,
      status,
    });
  }, [selectedClass, selectedSection, status]);

  const handleSearch = (value) => {
    setSearch(value);

    fetchStudents({
      page: 1,
      search: value,
      schoolClass: selectedClass,
      section: selectedSection,
      status,
    });
  };

  const handleReset = () => {
    setSearch("");
    setSelectedAcademicYear("");
    setSelectedClass("");
    setSelectedSection("");
    setStatus("");

    fetchStudents({
      page: 1,
    });
  };

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setViewOpen(true);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditOpen(true);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    await removeStudent(selectedStudent._id);

    setDeleteOpen(false);
    setSelectedStudent(null);
  };

  const handleImport = async () => {
    if (!file) return;
    await onImport(file);
    removeFile();
    onClose();
  };

  const totalStudents = pagination.totalStudents;

  const activeStudents = students.filter((student) => student.isActive).length;

  const inactiveStudents = totalStudents - activeStudents;

  const totalClasses = new Set(
    students.map((student) => student.schoolClass?._id),
  ).size;

  return (
    <>
      <PageHeader title="Students" subtitle="Manage all students" />

      <StudentStats
        totalStudents={totalStudents}
        activeStudents={activeStudents}
        inactiveStudents={inactiveStudents}
        totalClasses={totalClasses}
      />

      <StudentFilters
        search={search}
        setSearch={handleSearch}
        academicYears={[]}
        selectedAcademicYear={selectedAcademicYear}
        setSelectedAcademicYear={setSelectedAcademicYear}
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        sections={sections}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        status={status}
        setStatus={setStatus}
        onReset={handleReset}
        onImport={() => setImportOpen(true)}
        onExport={() =>
          downloadStudents({
            search,
            schoolClass: selectedClass,
            section: selectedSection,
            status,
          })
        }
        onAdd={() => {
          console.log("Add Student Clicked");
          setOpen(true);
        }}
      />

      <StudentTable
        students={students}
        loading={loading}
        onView={handleViewClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) =>
          fetchStudents({
            page,
            search,
            schoolClass: selectedClass,
            section: selectedSection,
            status,
          })
        }
      />

      <FormModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Student"
      >
        <StudentForm
          classes={classes}
          sections={sections}
          loading={loading}
          onSubmit={async (formData) => {
            await addStudent(formData);
            setOpen(false);
          }}
        />
      </FormModal>

      <FormModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedStudent(null);
        }}
        title="Edit Student"
      >
        <StudentForm
          initialData={selectedStudent}
          classes={classes}
          sections={sections}
          loading={loading}
          onSubmit={async (data) => {
            await editStudent(selectedStudent._id, data);

            setEditOpen(false);
            setSelectedStudent(null);
          }}
        />
      </FormModal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${selectedStudent?.fullname}"?`}
      />

      <StudentDetailsDrawer
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      <StudentImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        loading={loading}
        onImport={async (file) => {
          const result = await importStudentExcel(file);

          if (result) {
            setImportResult(result);

            setSummaryOpen(true);
          }
        }}
        onDownloadSample={() => {}}
      />
      <ImportSummaryModal
        isOpen={summaryOpen}
        onClose={() => {
          setSummaryOpen(false);

          setImportResult(null);
        }}
        result={importResult}
      />
    </>
  );
};

export default Students;
