const id = value => value?._id || value;
export function schoolClock(timeZone, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return { today: `${parts.year}-${parts.month}-${parts.day}`, day: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now), label: new Intl.DateTimeFormat('en-IN', { timeZone, weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(now), greeting: Number(parts.hour) < 12 ? 'Good morning' : Number(parts.hour) < 17 ? 'Good afternoon' : 'Good evening' };
}
export function dashboardYear(scope) {
  return scope.year || scope.options.years.find(y => y.isCurrent && y.isActive)?._id || '';
}
export function attendanceChoices(options, year, schoolClass) {
  return { classes: options.classes.filter(c => c.eligible && id(c.academicYear) === year), sections: options.sections.filter(s => s.eligible && id(s.schoolClass) === schoolClass) };
}
export function timetablePreview(records, assignments, year, day, today, limit = 5) {
  const eligible = new Set(assignments.filter(a => a.eligible && id(a.academicYear) === year && today >= a.academicYear.startDate.slice(0, 10) && today <= a.academicYear.endDate.slice(0, 10)).map(a => a._id));
  const rows = records.filter(r => r.isActive && r.period?.isActive && !r.period.isBreak && r.day === day && id(r.academicYear) === year && eligible.has(id(r.teacherAssignment))).sort((a, b) => a.period.startTime.localeCompare(b.period.startTime) || String(a._id).localeCompare(String(b._id)));
  return { records: rows.slice(0, limit), total: rows.length };
}
export function scopedFees(data, year) {
  return id(data?.statistics?.currentAcademicYear) === year && Number.isFinite(data?.statistics?.feesCollected) ? data.statistics.feesCollected : null;
}
export function attendancePercent(summary) {
  return summary?.total > 0 ? Number((summary.present / summary.total * 100).toFixed(2)) : null;
}
