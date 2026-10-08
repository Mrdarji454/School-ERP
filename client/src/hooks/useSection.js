import { useEffect, useState } from "react";
import { getSections } from "../services/sectionService";

const useSections = () => {
    const [sections, setSections] = useState([]);

    const fetchSections = async () => {
        try {
            const res = await getSections();
            setSections(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    return { sections, fetchSections };
};

export default useSections;