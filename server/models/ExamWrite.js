import mongoose from 'mongoose';
const schema = new mongoose.Schema({ actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, key: String, fingerprint: String, result: mongoose.Schema.Types.Mixed }, { timestamps: true });
schema.index({ actor: 1, key: 1 }, { unique: true });
export default mongoose.model('ExamWrite', schema);
