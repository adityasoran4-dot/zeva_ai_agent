// models/DoctorScreenshot.js
const mongoose = require('mongoose');

const DoctorScreenshotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkSession',
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast doctor + date queries
DoctorScreenshotSchema.index({ doctorId: 1, timestamp: -1 });

module.exports = mongoose.models.DoctorScreenshot || mongoose.model('DoctorScreenshot', DoctorScreenshotSchema);