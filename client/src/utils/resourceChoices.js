const id = v => v?._id || v;
const unique = rows => [...new Map(rows.filter(Boolean).map(r => [r._id, r])).values()];
export function resourceChoices(options, admin) {
  const assignments = (options.assignments || []).filter(a => a.eligible);
  return admin ? options : {
    years: unique(assignments.map(a => a.academicYear)),
    classes: unique(assignments.map(a => ({ ...a.schoolClass, academicYear: id(a.academicYear) }))),
    subjects: options.resourceSubjects || unique(assignments.map(a => ({ ...a.subject, schoolClass: id(a.schoolClass) }))),
    sections: unique(assignments.map(a => ({ ...a.section, schoolClass: id(a.schoolClass) }))), assignments,
  };
}
