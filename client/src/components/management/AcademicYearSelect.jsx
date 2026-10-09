import SelectField from "../ui/SelectField";
import { optionLabel } from "../../utils/management";
export default function AcademicYearSelect({ years, value, onChange, disabled = false, id = "academic-year-filter" }) {
  return <SelectField id={id} label="Academic year" value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>
    <option value="">All academic years</option>
    {value && !years.some(year => year._id === value) && <option value={value}>Previously selected year (unavailable)</option>}
    {years.map(year => <option key={year._id} value={year._id}>{optionLabel(year)}</option>)}
  </SelectField>;
}
