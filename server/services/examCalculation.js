import { fail } from '../utils/errors.js';
export function markNumber(value, label, nullable = false) {
  if (nullable && value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) fail(400, `${label} must be 0–100000 with at most two decimal places`);
  return value;
}
export function examPolicy(p, version = 1) {
  if (!p || !['none', 'sum'].includes(p.aggregation) || !Number.isInteger(p.decimals) || p.decimals < 0 || p.decimals > 2 || !['no-total', 'exclude'].includes(p.absent) || !['not-allowed', 'exclude'].includes(p.exempt)) fail(400, 'Explicit aggregation, rounding (0–2 decimals), absent and exempt policies are required');
  const passPercent = markNumber(p.passPercent, 'Overall pass percentage', true);
  if (passPercent > 100) fail(400, 'Overall pass percentage cannot exceed 100');
  if (!Array.isArray(p.grades) || p.grades.length > 20) fail(400, 'Grade boundaries must be an array (maximum 20)');
  const grades = p.grades.map(g => { const minimum = markNumber(g.minimum, 'Grade threshold'); if (minimum > 100 || typeof g.label !== 'string' || !g.label.trim() || g.label.length > 40) fail(400, 'Invalid grade boundary'); return { minimum, label: g.label.trim() }; }).sort((a, b) => b.minimum - a.minimum);
  if (new Set(grades.map(g => g.minimum)).size !== grades.length || new Set(grades.map(g => g.label)).size !== grades.length || (grades.length && grades.at(-1).minimum !== 0)) fail(400, 'Grade boundaries must be unique and cover zero through 100');
  if (p.aggregation === 'none' && (passPercent != null || grades.length)) fail(400, 'Overall pass/grade rules require sum aggregation');
  return { version, aggregation: p.aggregation, decimals: p.decimals, rounding: 'half-up', gradeBasis: 'rounded-percentage', absent: p.absent, exempt: p.exempt, passPercent, grades };
}
export function calculateExam(components, entries, policy) {
  let earned = 0, possible = 0, blocked = false;
  const marks = components.map(c => {
    const e = entries.find(e => String(e.component) === String(c._id));
    if (!e || e.state === 'Not entered') fail(409, 'Missing marks prevent publication');
    if (!['Scored', 'Absent', 'Exempt'].includes(e.state) || (e.state === 'Exempt' && policy.exempt !== 'exclude')) fail(409, 'Unresolved result state');
    if (e.state === 'Scored' && (markNumber(e.score, 'Score') > c.maximum)) fail(409, 'Score exceeds component maximum');
    if (c.contributes) {
      if (e.state === 'Scored') { earned += Math.round(e.score * 100); possible += Math.round(c.maximum * 100); }
      if (e.state === 'Absent' && policy.absent === 'no-total') blocked = true;
    }
    return { component: String(c._id), subject: String(c.subject), name: c.name, maximum: c.maximum, passMarks: c.passMarks, state: e.state, score: e.state === 'Scored' ? e.score : null, meetsComponentPassMark: e.state === 'Scored' && c.passMarks != null ? e.score >= c.passMarks : null, contributes: c.contributes };
  });
  const totalDefined = policy.aggregation === 'sum' && !blocked && possible > 0, scale = 10 ** policy.decimals;
  const percentage = totalDefined ? Math.round(earned * 100 * scale / possible) / scale : null;
  return { marks, total: totalDefined ? Math.round(earned * scale / 100) / scale : null, maximum: totalDefined ? possible / 100 : null, percentage, grade: percentage == null ? null : policy.grades.find(g => percentage >= g.minimum)?.label || null, meetsOverallPassThreshold: percentage != null && policy.passPercent != null ? percentage >= policy.passPercent : null, totalNote: policy.aggregation === 'none' ? 'Totals not configured' : blocked ? 'Total withheld by absent-entry policy' : possible === 0 ? 'No scored contributing components' : 'Sum of scored contributing components; configured exclusions omitted from numerator and denominator' };
}
