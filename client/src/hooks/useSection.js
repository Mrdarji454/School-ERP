import { useEffect, useState } from "react";
import { getSections } from "../services/sectionService";
export default function useSections() {
 const [sections, setSections] = useState([]), [error, setError] = useState("");
 useEffect(() => { let active = true; getSections().then(res => { if(active) setSections(res.data); }).catch(() => { if(active) setError("Unable to load sections"); }); return () => { active = false; }; }, []);
 return { sections, error };
}