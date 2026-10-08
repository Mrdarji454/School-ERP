import { useEffect, useState } from "react";
import { getClasses } from "../services/calssService";
const useClasses = () => {
    const [classes, setClasses] = useState([]);

    const fetchClasses = async () => {
        try {
            const res = await getClasses();
            setClasses(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    return { classes, fetchClasses };
};

export default useClasses;