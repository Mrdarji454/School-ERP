import api from "./api";

export const getStudents = async (params) => {
    const { data } = await api.get("/students", { params, });
    return data;
};

export const getStudentById = async (id) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
};

export const createStudent = async (payload) => {
    const { data } = await api.post("/students", payload);
    return data;
};

export const updateStudent = async (id, payload) => {
    const { data } = await api.put(`/students/${id}`, payload);
    return data;
};

export const deleteStudent = async (id) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
};

export const restoreStudent = async (id) => {
    const { data } = await api.patch(`/students/${id}/restore`);
    return data;
};

export const exportStudents = async (params) => {
    const response = await api.get("/students/export", {
        params,
        responseType: "blob",
    });
    return response.data;
};
export const importStudents = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await api.post("/students/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};