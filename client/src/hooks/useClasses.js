import { useEffect, useState } from "react";
import { getClasses } from "../services/calssService";
export default function useClasses() {
 const [classes, setClasses] = useState([]), [error, setError] = useState("");
 useEffect(() => { let active = true; getClasses().then(res => { if(active) setClasses(res.data); }).catch(() => { if(active) setError("Unable to load classes"); }); return () => { active = false; }; }, []);
 return { classes, error };
}