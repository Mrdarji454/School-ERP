import { listCommunications } from '../communications.js';
export const getNotifications = async () => (await listCommunications('notices', { role: 'Admin' }, { limit: '5' }, true)).records;
