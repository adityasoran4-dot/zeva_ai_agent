// models/Screenshot.js
const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkSession', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Screenshot || mongoose.model('Screenshot', ScreenshotSchema);