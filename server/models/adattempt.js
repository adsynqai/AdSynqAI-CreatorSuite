const mongoose = require('mongoose');

const AdAttemptSchema = new mongoose.Schema({
  userId: String,
  promoName: String,
  prompt: String,
  type: String, // e.g., 'video', 'voice', 'image' — or composite

  // ✅ Add these fields for multi-modal tracking
  imagePath: { type: String, default: null },
  audioPath: { type: String, default: null },
  videoPath: { type: String, default: null },
  syncMap: { type: Array, default: [] }, // to store segments if needed

  isFinal: { type: Boolean, default: false },
  finalizedAt: { type: Date },
  attemptCount: { type: Number, default: 1 },
  imageAttempts: { type: Number, default: 0 },
  audioAttempts: { type: Number, default: 0 },
  videoAttempts: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdAttempt', AdAttemptSchema);