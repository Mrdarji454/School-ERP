import mongoose from 'mongoose';
import { assignmentFile } from './Assignment.js';
const ref = name => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
const schema = new mongoose.Schema({
  assignment: ref('Assignment'), recipient: ref('AssignmentRecipient'), user: ref('User'),
  sequence: { type: Number, required: true }, text: { type: String, maxlength: 20000, default: '' }, file: assignmentFile,
  submittedAt: { type: Date, required: true }, late: { type: Boolean, required: true }, dueAt: Date, cutoffAt: Date, assignmentRevision: Number,
  idempotencyKey: { type: String, required: true }, fingerprint: { type: String, required: true },
}, { timestamps: true });
schema.index({ recipient: 1, sequence: 1 }, { unique: true });
schema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
schema.index({ 'file.key': 1 });
export default mongoose.model('AssignmentSubmission', schema);
