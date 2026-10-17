import mongoose from 'mongoose';
const ref = name => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
const schema = new mongoose.Schema({
  assignment: ref('Assignment'), student: ref('Student'), user: ref('User'),
  name: String, admissionNo: String, section: ref('Section'), rollNumber: Number,
  evidence: { type: String, enum: ['enrollment-at-publication', 'current-placement-snapshot', 'explicit-addition'], required: true },
  capturedAt: { type: Date, default: Date.now }, effectiveDate: Date, enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'AssignmentSubmission' }, sequence: { type: Number, default: 0 },
  feedbackSeenAt: Date,
}, { timestamps: true });
schema.index({ assignment: 1, student: 1 }, { unique: true });
schema.index({ user: 1, assignment: 1 });
export default mongoose.model('AssignmentRecipient', schema);
