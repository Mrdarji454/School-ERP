import { useCallback, useEffect, useRef, useState } from "react";
import { AcademicScopeContext } from "./AcademicScopeState";
import { getManagementOptions } from "../services/managementService";
import { apiError } from "../utils/management";
const empty = { years: [], classes: [], sections: [], subjects: [], teachers: [] };
export default function AcademicScopeProvider({ children }) {
  const [year, setYearState] = useState(() => sessionStorage.getItem("adminAcademicYear") || "");
  const [state, setState] = useState({ options: empty, loading: true, error: "" });
  const controller = useRef(null);
  const refreshOptions = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setState(prev => ({ ...prev, loading: true, error: "" }));
    try { const options = await getManagementOptions(current.signal); if (!current.signal.aborted) setState({ options, loading: false, error: "" }); }
    catch (error) { if (!current.signal.aborted) setState(prev => ({ ...prev, loading: false, error: apiError(error) })); }
  }, []);
  useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) refreshOptions(); }); return () => { active = false; controller.current?.abort(); }; }, [refreshOptions]);
  const setYear = value => { sessionStorage.setItem("adminAcademicYear", value); setYearState(value); };
  return <AcademicScopeContext.Provider value={{ ...state, year, setYear, refreshOptions }}>{children}</AcademicScopeContext.Provider>;
}
