import { useEffect, useState } from "react";
import { toast } from "sonner";
import { importStudents as importStudentsApi } from "../services/studentService";

import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  exportStudents,
  importStudents,
} from "../services/studentService";

const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 10,
  });

  const fetchStudents = async (params = {}) => {

    try {

      setLoading(true);

      const res = await getStudents(params);

      setStudents(res.data.students);

      setPagination(res.data.pagination);

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
        "Failed to fetch students"
      );

    } finally {

      setLoading(false);

    }

  };

  const addStudent = async (studentData) => {
    try {
      setLoading(true);

      await createStudent(studentData);

      toast.success("Student added successfully");

      await fetchStudents({
        page: pagination.page,
      });
    } catch (err) {
      console.log(error.response?.data);
      toast.error(
        err.response?.data?.message || "Failed to add student"
      );
    } finally {
      setLoading(false);
    }
  };

  const editStudent = async (id, payload) => {
    try {
      await updateStudent(id, payload);

      toast.success("Student updated successfully");

      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student");
    }
  };

  const removeStudent = async (id) => {
    await deleteStudent(id);
    toast.success("Student deleted successfully");
    fetchStudents();
  };

  const recoverStudent = async (id) => {
    await restoreStudent(id);
    toast.success("Student restored successfully");
    fetchStudents();
  };

  const downloadStudents = async (filters) => {

    try {
      const blob = await exportStudents(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export completed");
    } catch (err) {
      toast.error("Export failed");
    }

  };
  const importStudentExcel = async (file) => {
    try {
      setLoading(true);

      const res = await importStudentsApi(file);

      toast.success(
        `Imported: ${res.data.imported} | Failed: ${res.data.failed}`
      );

      await fetchStudents();

      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    fetchStudents,
    addStudent,
    editStudent,
    removeStudent,
    recoverStudent,
    pagination,
    setPagination,
    downloadStudents,
    importStudentExcel,
  };
};

export default useStudents;
