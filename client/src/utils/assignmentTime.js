import { schoolDateTimeInput, schoolTimestamp } from './publication.js';
// datetime-local controls have minute precision. Preserve unchanged stored instants,
// including seconds, so editing instructions cannot shorten or move a deadline.
export function assignmentTimestamp(value, original, zone) {
  return original && value === schoolDateTimeInput(original, zone) ? original : schoolTimestamp(value, zone);
}
