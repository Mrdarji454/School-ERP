import mongoose from 'mongoose';
const ref = model => ({ type: mongoose.Schema.Types.ObjectId, ref: model, required: true });
const schema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 }, description: { type: String, default: '', maxlength: 4000 },
  type: { type: String, enum: ['Mock test', 'Study material', 'Answer key'], required: true },
  academicYear: ref('AcademicYear'), schoolClass: ref('SchoolClass'), subject: ref('Subject'),
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }], uploader: ref('User'),
  state: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishAt: { type: Date, default: null }, expiresAt: { type: Date, default: null },
  file: { key: { type: String, required: true }, name: { type: String, required: true }, size: Number, sha256: String, mime: { type: String, default: 'application/pdf' } },
  audit: [{ action: String, actor: ref('User'), at: { type: Date, default: Date.now }, reason: String }],
}, { timestamps: true });
schema.index({ academicYear: 1, schoolClass: 1, sections: 1, state: 1, publishAt: 1 });
schema.index({ uploader: 1, createdAt: -1 });
schema.index({ 'file.key': 1 }, { unique: true });
export default mongoose.model('LearningResource', schema);
