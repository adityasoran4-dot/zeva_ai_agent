import mongoose from 'mongoose';

const ClinicNavigationItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    index: false // Explicitly disable unique index on label to allow common sidebar items across roles
  },
  path: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  badge: {
    type: Number,
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicNavigationItem',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  moduleKey: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'clinic', 'doctor'],
    required: true
  },
 subModules: [{
  name: { type: String, required: true },
  path: { type: String },
  icon: { type: String, required: true },
  order: { type: Number, default: 0 },
  moduleKey: { type: String, required: true }
}]
}, { timestamps: true });

// Index for efficient queries
ClinicNavigationItemSchema.index({ moduleKey: 1, role: 1 }); // Index for moduleKey and role combination (not unique)
ClinicNavigationItemSchema.index({ parentId: 1 });
ClinicNavigationItemSchema.index({ order: 1 });
ClinicNavigationItemSchema.index({ role: 1 }); // Index for role-based queries

export default mongoose.models.ClinicNavigationItem || mongoose.model('ClinicNavigationItem', ClinicNavigationItemSchema);
