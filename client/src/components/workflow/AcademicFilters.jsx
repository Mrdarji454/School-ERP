import SelectField from '../ui/SelectField';
import { uniqueReferences, filterAssignments, label } from '../../utils/workflow';
export default function AcademicFilters({ assignments, values, onChange, includeTeacher = true }) {
  const fields = [['academicYear', 'Academic year'], ['schoolClass', 'Class'], ['section', 'Section'], ...(includeTeacher ? [['teacher', 'Teacher']] : [])];
  return fields.map(([key, title]) => {
    const dependencies = key === 'academicYear' || key === 'teacher' ? {} : key === 'schoolClass' ? { academicYear: values.academicYear } : { academicYear: values.academicYear, schoolClass: values.schoolClass };
    const options = uniqueReferences(filterAssignments(assignments, dependencies), key);
    return <SelectField key={key} id={`workflow-${key}`} label={title} value={values[key] || ''} onChange={e => onChange({ ...values, [key]: e.target.value, ...(['academicYear', 'schoolClass'].includes(key) ? { section: '' } : {}), ...(key === 'academicYear' ? { schoolClass: '' } : {}) })}><option value="">All {title.toLowerCase()}s</option>{options.map(option => <option key={option._id} value={option._id}>{key === 'teacher' ? option.user?.fullname || 'Missing teacher' : label(option)}</option>)}</SelectField>;
  });
}
