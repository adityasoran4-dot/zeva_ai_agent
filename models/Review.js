import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: false },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: false },
  },
  { timestamps: true }
);

// Optional: Custom validator to ensure at least one of clinicId or doctorId is provided
ReviewSchema.pre('save', function (next) {
  if (!this.clinicId && !this.doctorId) {
    return next(new Error('Either clinicId or doctorId must be provided.'));
  }
  next();
});

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
