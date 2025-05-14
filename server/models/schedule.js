// ================================
// models/Schedule.js
// ================================
const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'sent'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);