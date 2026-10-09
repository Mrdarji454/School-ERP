import api from "./api";
export const listManagement = async (resource, params, signal) => (await api.get(`/admin-management/${resource}`, { params, signal })).data.data;
export const getManagementOptions = async signal => (await api.get("/admin-management/options", { signal })).data.data;
export const getClassDependencies = async (id, signal) => (await api.get(`/admin-management/classes/${id}/dependencies`, { signal })).data.data;
export const saveManagement = async (resource, id, data) => (await (id ? api.put(`/${resource}/${id}`, data) : api.post(`/${resource}`, data))).data.data;
export const deactivateManagement = async (resource, id) => (await api.delete(`/${resource}/${id}`)).data;
export const restoreManagement = async (resource, id) => (await api.patch(`/${resource}/${id}${resource === "academic-years" ? "" : "/restore"}`)).data;
export const setCurrentYear = async id => (await api.patch(`/academic-years/${id}/current`)).data;
