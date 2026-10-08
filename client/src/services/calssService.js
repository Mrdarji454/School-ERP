import api from "./api";

export const getClasses = async () => {
    const { data } = await api.get("/classes");
    return data;
};