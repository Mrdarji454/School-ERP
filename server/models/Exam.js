import mongoose from 'mongoose';
const ref = name => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
const component = new mongoose.Schema({ name: String, subject: ref('Subject'), schoolClass: ref('SchoolClass'), sections: [ref('Section')], maximum: Number, passMarks: { type: Number, default: null }, evaluators: [ref('User')], order: Number, contributes: Boolean, state: { type: String, enum: ['entry', 'submitted', 'returned', 'approved'], default: 'entry' }, returnReason: String });
const candidate = new mongoose.Schema({ student: ref('Student'), user: ref('User'), name: String, admissionNo: String, academicYear: ref('AcademicYear'), schoolClass: ref('SchoolClass'), section: ref('Section'), className: String, sectionName: String, rollNumber: Number, enrollment: ref('Enrollment'), eligibilityDate: Date, capturedAt: Date, active: { type: Boolean, default: true }, seenVersion: { type: Number, default: 0 } });
const entry = new mongoose.Schema({ candidate: { type: mongoose.Schema.Types.ObjectId, required: true }, component: { type: mongoose.Schema.Types.ObjectId, required: true }, state: { type: String, enum: ['Not entered', 'Scored', 'Absent', 'Exempt'] }, score: { type: Number, default: null }, actor: ref('User'), at: Date }, { _id: false });
const schema = new mongoose.Schema({
  name: { type: String, required: true }, description: String, academicYear: ref('AcademicYear'), sections: [ref('Section')], startDate: Date, endDate: Date, eligibilityDate: Date, entryDeadline: Date,
  state: { type: String, enum: ['draft', 'open-for-entry', 'submitted-for-review', 'approved', 'published', 'archived'], default: 'draft' },
  components: [component], policy: mongoose.Schema.Types.Mixed, candidates: [candidate], unresolved: [mongoose.Schema.Types.Mixed], entries: [entry], capturedAt: Date,
  revision: { type: Number, default: 0 }, lockRevision: { type: Number, default: 0 }, publicationVersion: { type: Number, default: 0 }, correctionReason: String,
  author: ref('User'), audit: [{ actor: ref('User'), at: { type: Date, default: Date.now }, action: String, reason: String, before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });
schema.index({ academicYear: 1, state: 1, startDate: 1 });
schema.index({ 'components.evaluators': 1 });
schema.index({ 'candidates.user': 1 });
export default mongoose.model('Exam', schema);
