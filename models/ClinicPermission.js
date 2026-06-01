// models/ClinicPermission.js
import mongoose from 'mongoose';

const ModulePermissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true
  },
  subModules: [{
    name: { type: String, required: true },
    path: { type: String, default: '' },
    icon: { type: String, default: '📄' },
    order: { type: Number, default: 0 },
    moduleKey: { type: String, required: false },
    actions: {
      all: { type: Boolean, default: true },
      create: { type: Boolean, default: true },
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: true },
      delete: { type: Boolean, default: true }
    }
  }],
  actions: {
    all: { type: Boolean, default: true },
    create: { type: Boolean, default: true },
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true }
  }
});

const ClinicPermissionSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['admin', 'clinic', 'doctor'],
    required: true,
    default: 'clinic',
    index: true
  },
  permissions: [ModulePermissionSchema],
  isActive: { type: Boolean, default: true },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
ClinicPermissionSchema.index({ 'permissions.module': 1 });
ClinicPermissionSchema.index({ clinicId: 1, role: 1 }, { unique: true });

if (mongoose.models.ClinicPermission) {
  delete mongoose.models.ClinicPermission;
}

export default mongoose.model('ClinicPermission', ClinicPermissionSchema);
