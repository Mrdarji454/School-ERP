import mongoose from 'mongoose';
const schema = new mongoose.Schema({ exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true }, version: { type: Number, required: true }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, reason: String, payload: { type: mongoose.Schema.Types.Mixed, required: true } }, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ exam: 1, version: 1 }, { unique: true });
schema.index({ 'payload.results.user': 1 });
export default mongoose.model('ExamPublication', schema);
