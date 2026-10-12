export function publicationLabel(row, now = new Date()) {
  if (row.state === 'archived') return 'Archived';
  if (row.isActive === false) return 'Inactive';
  if (row.state === 'draft') return 'Draft';
  const start = row.publishAt || row.publishDate, end = row.expiresAt || row.expiryDate;
  if (end && new Date(end) <= now) return 'Expired';
  if (start && new Date(start) > now) return 'Scheduled';
  return 'Published';
}
export function schoolDateTimeInput(value, timeZone) {
  if (!value) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function schoolTimestamp(value, timeZone) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid date and time');
  const wall = Date.parse(`${value}:00Z`); let instant = wall;
  for (let i = 0; i < 3; i++) instant += wall - Date.parse(`${schoolDateTimeInput(new Date(instant), timeZone)}:00Z`);
  const date = new Date(instant);
  if (!Number.isFinite(instant) || schoolDateTimeInput(date, timeZone) !== value) throw new Error('This local time does not exist in the school timezone');
  return date.toISOString();
}
export const publicationTime = (value, timeZone) => value ? new Intl.DateTimeFormat('en-IN', { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not scheduled';
