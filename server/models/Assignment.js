import mongoose from 'mongoose';
const ref = name => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
export const assignmentFile = new mongoose.Schema({ key: String, name: String, size: Number, sha256: String, mime: String }, { _id: false });
export const assignmentAudit = new mongoose.Schema({ actor: ref('User'), at: { type: Date, default: Date.now }, action: String, reason: String, before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed }, { _id: false });
const schema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 }, instructions: { type: String, default: '', maxlength: 10000 },
  academicYear: ref('AcademicYear'), schoolClass: ref('SchoolClass'), subject: ref('Subject'), sections: [ref('Section')], author: ref('User'),
  evaluators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  state: { type: String, enum: ['draft', 'published', 'closed', 'archived'], default: 'draft' },
  publishAt: Date, dueAt: { type: Date, required: true }, cutoffAt: Date,
  maxMarks: { type: Number, required: true, min: 0 }, allowResubmission: { type: Boolean, default: false },
  file: assignmentFile, audienceLocked: { type: Boolean, default: false }, activatedAt: Date,
  audit: [assignmentAudit], revision: { type: Number, default: 0 }, lockRevision: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ state: 1, publishAt: 1, activatedAt: 1 });
schema.index({ author: 1, dueAt: 1 });
export default mongoose.model('Assignment', schema);
