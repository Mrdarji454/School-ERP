import api from './api';
export const workflowRead = async (path, params, signal) => (await api.get(`/workflow/${path}`, { params, signal })).data.data;
export const saveSchedule = async (id, data) => (await (id ? api.put(`/timetables/${id}`, data) : api.post('/timetables', data))).data.data;
export const deactivateSchedule = id => api.delete(`/timetables/${id}`);
export const saveAttendance = async (id, data) => (await (id ? api.put(`/attendance/${id}`, data) : api.post('/attendance', data))).data.data;
export const changeAttendanceLock = (id, data) => api.patch(`/workflow/attendance/${id}/lock`, data);
export const deactivateAttendance = (id, data) => api.delete(`/attendance/${id}`, { data });
