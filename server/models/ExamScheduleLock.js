import mongoose from 'mongoose';
export default mongoose.model('ExamScheduleLock', new mongoose.Schema({ _id: String, revision: { type: Number, default: 0 } }));
