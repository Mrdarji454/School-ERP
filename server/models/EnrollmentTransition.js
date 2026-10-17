import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  transitionId: { type: String, required: true, unique: true }, fingerprint: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, enum: ['admission', 'transfer', 'promotion', 'repeat', 'withdrawal', 'completion'], required: true },
  effectiveDate: { type: Date, required: true }, previousEnrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true }, impact: { recordedEntries: Number, unresolvedHistory: Boolean },
}, { timestamps: true });
schema.index({ student: 1, createdAt: -1 });
export default mongoose.model('EnrollmentTransition', schema);
