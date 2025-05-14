// ================================
// models/Feedback.js
// ================================
const mongoose = require('mongoose');
const FeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  rating: { type: Number, min: 1, max: 5 },
  message: { type: String },
  adRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);