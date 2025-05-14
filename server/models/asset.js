const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  type: { type: String, required: true },             // 'text', 'voice', 'image', 'video'
  prompt: { type: String, required: true },
  filePath: { type: String, required: true },         // Ensure always saved
  language: { type: String, default: 'en' },          // Set a default
  duration: { type: String },
  userId: { type: String, required: true },
  promoName: { type: String, required: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

// Optional performance optimization
assetSchema.index({ userId: 1, promoName: 1, version: -1 });

module.exports = mongoose.model('Asset', assetSchema);