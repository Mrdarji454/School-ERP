export function componentCompletion(exam, component, section = '') {
 const candidates = exam.candidates.filter(c => c.active && component.sections.includes(c.section) && (!section || c.section === section));
 const missing = candidates.filter(c => { const e = exam.entries.find(e => e.candidate === c._id && e.component === component._id); return !e || e.state === 'Not entered' || (e.state === 'Exempt' && exam.policy.exempt !== 'exclude') || (e.state === 'Scored' && (typeof e.score !== 'number' || !Number.isFinite(e.score) || e.score < 0 || e.score > component.maximum)); }).length;
 return { required: candidates.length, missing };
}
