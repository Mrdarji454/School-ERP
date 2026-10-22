import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  publication: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamPublication', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceVersion: { type: Number, required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, required: true },
  section: { type: mongoose.Schema.Types.ObjectId, required: true },
  issueNumber: { type: Number, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issuedAt: { type: Date, required: true },
  reason: String, remarks: String, templateVersion: { type: String, required: true },
  previous: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportCard', default: null },
  fingerprint: { type: String, required: true }, snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  file: { key: { type: String, required: true }, name: String, mime: String, size: Number, sha256: String },
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ publication: 1, candidate: 1 }, { unique: true });
schema.index({ exam: 1, candidate: 1, issueNumber: 1 }, { unique: true });
schema.index({ user: 1, academicYear: 1, exam: 1 });
schema.index({ 'file.key': 1 });
export default mongoose.model('ReportCard', schema);
