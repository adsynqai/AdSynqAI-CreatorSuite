// ================================
// models/Ad.js
// ================================
const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['image', 'video', 'text'], required: true },
  content: { type: Object, required: true },
  category: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);