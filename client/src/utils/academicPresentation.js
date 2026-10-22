import { displayDate, displayTime } from './management.js';

export const academicResources = ['academic-years', 'classes', 'sections', 'subjects', 'periods', 'teacher-assignments'];
export const isAcademicPath = pathname => academicResources.some(resource => pathname === `/admin/${resource}`);
const reference = value => value?.name ? `${value.name}${value.isActive === false ? ' (inactive)' : ''}` : 'Missing reference';
const placement = row => `${reference(row.schoolClass)} · ${reference(row.academicYear || row.schoolClass?.academicYear)}`;

// The same real values drive desktop columns and labelled mobile cards.
export function academicColumns(resource) {
  const name = { header: resource === 'academic-years' ? 'Academic year' : resource === 'periods' ? 'Period' : 'Name', value: row => row.name || 'Unnamed record' };
  return {
    'academic-years': [name, { header: 'Start date', value: r => displayDate(r.startDate) }, { header: 'End date', value: r => displayDate(r.endDate) }, { header: 'Current', value: r => r.isCurrent ? 'Current year' : '—' }],
    classes: [name, { header: 'Academic year', value: r => reference(r.academicYear) }, { header: 'Sections', value: r => r.sectionCount ?? '—' }, { header: 'Active students', value: r => r.studentCount ?? '—' }],
    sections: [name, { header: 'Class / Year', value: placement }, { header: 'Class teacher', value: r => r.classTeacher?.user?.fullname || 'Not assigned' }, { header: 'Capacity', value: r => r.capacity ?? '—' }],
    subjects: [name, { header: 'Code', value: r => r.code || '—' }, { header: 'Class / Year', value: placement }, { header: 'Type', value: r => r.isOptional ? 'Optional' : 'Core' }],
    periods: [name, { header: 'Number', value: r => r.periodNumber }, { header: 'Start time', value: r => displayTime(r.startTime) }, { header: 'End time', value: r => displayTime(r.endTime) }, { header: 'Kind', value: r => r.isBreak ? 'Break' : 'Lesson' }],
    'teacher-assignments': [{ header: 'Teacher', value: r => r.teacher?.user?.fullname || 'Missing teacher' }, { header: 'Class / Section', value: r => `${reference(r.schoolClass)} · ${reference(r.section)}` }, { header: 'Subject', value: r => reference(r.subject) }, { header: 'Class teacher', value: r => r.isClassTeacher ? 'Yes' : 'No' }],
  }[resource] || [];
}

export const initialAcademicFilters = () => ({ search: '', status: 'all', schoolClass: '', section: '', teacher: '', subject: '', page: 1, limit: 10 });
export function changeAcademicFilter(filters, name, value) {
  return { ...filters, [name]: value, page: 1, ...(name === 'schoolClass' ? { section: '', subject: '' } : {}) };
}
export function lockedAcademicField(resource, record, field) {
  return Boolean(record && (field.immutable || (resource === 'periods' && record.isScheduled && ['startTime', 'endTime', 'isBreak'].includes(field.name)) || (resource === 'academic-years' && record.hasEnrollments && ['startDate', 'endDate'].includes(field.name))));
}
