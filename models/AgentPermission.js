// models/AgentPermission.js
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
    moduleKey: { type: String }, // Added moduleKey field
    actions: {
      all: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      print: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      approve: { type: Boolean, default: false }
    }
  }],
  actions: {
    all: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    print: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    approve: { type: Boolean, default: false }
  }
});

const AgentPermissionSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
AgentPermissionSchema.index({ agentId: 1 });
AgentPermissionSchema.index({ 'permissions.module': 1 });
AgentPermissionSchema.index({ grantedBy: 1 });

export default mongoose.models.AgentPermission || mongoose.model('AgentPermission', AgentPermissionSchema);


