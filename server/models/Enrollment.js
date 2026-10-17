import mongoose from 'mongoose';
const ref = name => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });
const schema = new mongoose.Schema({
  student: ref('Student'), academicYear: ref('AcademicYear'), schoolClass: ref('SchoolClass'), section: ref('Section'),
  rollNumber: { type: Number, min: 1, required: true }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed', 'withdrawn', 'completed'], default: 'active' },
  transitionType: { type: String, enum: ['admission', 'transfer', 'promotion', 'repeat'], required: true },
  closingTransitionType: { type: String, enum: ['admission', 'transfer', 'promotion', 'repeat', 'withdrawal', 'completion'] },
  previousEnrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }, actor: ref('User'), reason: { type: String, required: true },
  initialized: { type: Boolean, default: false }, closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, closedAt: Date, closeReason: String,
}, { timestamps: true });
schema.index({ student: 1, startDate: 1, endDate: 1 });
schema.index({ academicYear: 1, schoolClass: 1, section: 1, rollNumber: 1, startDate: 1, endDate: 1 });
schema.pre('validate', function () { if (this.startDate >= this.endDate) this.invalidate('endDate', 'End must be after start (exclusive)'); });
export default mongoose.model('Enrollment', schema);
