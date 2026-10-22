import mongoose from 'mongoose';
const schema = new mongoose.Schema({ exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true }, component: { type: mongoose.Schema.Types.ObjectId, required: true }, sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }], date: Date, startTime: String, endTime: String, room: String, roomKey: String, invigilator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, active: { type: Boolean, default: true }, revision: { type: Number, default: 0 }, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true });
schema.index({ date: 1, active: 1, startTime: 1, endTime: 1 });
schema.index({ exam: 1, component: 1 });
export default mongoose.model('ExamSchedule', schema);
