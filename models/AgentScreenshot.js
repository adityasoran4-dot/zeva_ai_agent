// models/AgentScreenshot.js
const mongoose = require('mongoose');

const AgentScreenshotSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
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

// Compound index for fast agent + date queries
AgentScreenshotSchema.index({ agentId: 1, timestamp: -1 });

module.exports = mongoose.models.AgentScreenshot || mongoose.model('AgentScreenshot', AgentScreenshotSchema);