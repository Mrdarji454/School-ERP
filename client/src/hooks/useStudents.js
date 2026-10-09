import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import * as service from "../services/studentService";
import api from "../services/api";
const saveBlob = (blob, name) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };
export default function useStudents() {
 const [students, setStudents] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState("");
 const [statistics, setStatistics] = useState({ total: 0, active: 0, inactive: 0, classes: 0 });
 const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalStudents: 0, limit: 10 });
 const paramsRef = useRef({}), requestRef = useRef(0);
 const fetchStudents = useCallback(async (params = paramsRef.current) => {
  paramsRef.current = params;
  const request = ++requestRef.current; setLoading(true); setError("");
  try {
   const res = await service.getStudents(params);
   if (request !== requestRef.current) return;
   setStudents(res.data.students); setPagination(res.data.pagination); setStatistics(res.data.statistics);
   paramsRef.current = { ...params, page: res.data.pagination.page };
  } catch (err) { if (request === requestRef.current) { setError(err.response?.data?.message || "Failed to fetch students"); setStudents([]); } }
  finally { if (request === requestRef.current) setLoading(false); }
 }, []);
 const mutate = async (action, message) => {
  setLoading(true);
  try { const result = await action(); toast.success(message); await fetchStudents(); return result; }
  catch (err) { toast.error(err.response?.data?.message || "Operation failed"); throw err; }
  finally { setLoading(false); }
 };
 return { students, loading, error, statistics, pagination, fetchStudents,
  addStudent: data => mutate(() => service.createStudent(data), "Student added"),
  editStudent: (id, data) => mutate(() => service.updateStudent(id, data), "Student updated"),
  removeStudent: id => mutate(() => service.deleteStudent(id), "Student deactivated"),
  recoverStudent: id => mutate(() => service.restoreStudent(id), "Student restored"),
  importStudentExcel: async file => (await mutate(() => service.importStudents(file), "Import processed")).data,
  downloadStudents: async filters => { try { saveBlob(await service.exportStudents(filters), "students.xlsx"); } catch { toast.error("Export failed"); } },
  downloadSample: async () => { try { saveBlob((await api.get("/students/sample", { responseType: "blob" })).data, "student-import-template.xlsx"); } catch { toast.error("Sample download failed"); } },
 };
}