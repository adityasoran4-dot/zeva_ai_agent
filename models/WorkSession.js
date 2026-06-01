// models/WorkSession.js
const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const WorkSessionSchema = new mongoose.Schema({
  // Store all possible ID references
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  
  // Role-specific ID references for easier querying
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: false,
    index: true,
    sparse: true
  },
  
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: false,
    index: true,
    sparse: true
  },

  role: {
    type: String,
    enum: ['agent', 'doctor', 'doctorStaff'],
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    index: true
  },

  arrivalTime: {
    type: Date
  },

  leftTime: {
    type: Date
  },

  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE'
  },

  statusHistory: [StatusHistorySchema],

  lastActivity: {
    type: Date,
    default: Date.now
  },

  deskTimeSeconds: {
    type: Number,
    default: 0
  },

  productiveSeconds: {
    type: Number,
    default: 0
  },

  productivityPercentage: {
    type: Number,
    default: 0
  },

  activityLogs: [{
    timestamp: Date,
    isActive: Boolean,
    duration: Number,
    activityType: String,
  }],

  agentScreenshots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentScreenshot'
  }],

  doctorScreenshots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorScreenshot'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },
});

// Pre-save middleware to populate role-specific fields
WorkSessionSchema.pre('save', function(next) {
  // Always set userId to the main user ID
  if (!this.userId && (this.doctorId || this.agentId)) {
    this.userId = this.doctorId || this.agentId;
  }
  
  // Set role-specific field based on role
  if (this.role === 'doctor' || this.role === 'doctorStaff') {
    this.doctorId = this.userId;
    this.agentId = undefined;
  } else if (this.role === 'agent') {
    this.agentId = this.userId;
    this.doctorId = undefined;
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes
WorkSessionSchema.index({ userId: 1, date: 1 });
WorkSessionSchema.index({ role: 1, date: 1 });
WorkSessionSchema.index({ doctorId: 1, date: 1 }, { sparse: true });
WorkSessionSchema.index({ agentId: 1, date: 1 }, { sparse: true });

// Compound unique index
WorkSessionSchema.index({ 
  userId: 1, 
  role: 1, 
  date: 1 
}, { 
  unique: true
});

// Static method to find or create session
WorkSessionSchema.statics.findOrCreateToday = async function(userId, role) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let session = await this.findOne({
    userId: userId,
    role: role,
    date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
  });
  
  if (!session) {
    session = new this({
      userId: userId,
      role: role,
      date: today
    });
    
    // Set role-specific field
    if (role === 'doctor' || role === 'doctorStaff') {
      session.doctorId = userId;
    } else if (role === 'agent') {
      session.agentId = userId;
    }
    
    await session.save();
  }
  
  return session;
};

// Calculate productivity
WorkSessionSchema.methods.calculateProductivity = function () {
  if (this.deskTimeSeconds > 0) {
    this.productivityPercentage = Math.round(
      (this.productiveSeconds / this.deskTimeSeconds) * 100
    );
  }
  return this;
};

module.exports = mongoose.models.WorkSession || mongoose.model('WorkSession', WorkSessionSchema);