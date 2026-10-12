// Compatibility entry points share the preview/commit and export contract.
import { profileTemplate, exportPeople, importPeople, workbookColumns } from '../peopleWorkbook.js';
export const columns = workbookColumns('students');
export const sampleWorkbook = () => profileTemplate('students');
export const exportWorkbook = query => exportPeople('students', { ...query, status: query.status === 'true' ? 'active' : query.status === 'false' ? 'inactive' : query.status || 'all' });
export const importWorkbook = (file, body, actor) => importPeople('students', file, body || {}, actor);
