import mongoose from 'mongoose';

const NavigationItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
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
    ref: 'NavigationItem',
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
    required: true,
    unique: true
  },
  subModules: [{
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }]
}, { timestamps: true });

// Index for efficient queries
NavigationItemSchema.index({ moduleKey: 1 });
NavigationItemSchema.index({ parentId: 1 });
NavigationItemSchema.index({ order: 1 });

export default mongoose.models.NavigationItem || mongoose.model('NavigationItem', NavigationItemSchema);
