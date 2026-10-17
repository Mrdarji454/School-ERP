import mongoose from 'mongoose';
import { assignmentAudit } from './Assignment.js';
const schema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'AssignmentSubmission', required: true, unique: true },
  draft: { score: Number, feedback: String },
  published: { score: Number, feedback: String, action: { type: String, enum: ['graded', 'returned'] }, at: Date, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  revision: { type: Number, default: 0 }, audit: [assignmentAudit],
}, { timestamps: true });
export default mongoose.model('AssignmentEvaluation', schema);
