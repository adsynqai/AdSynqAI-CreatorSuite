// ================================
// models/ContactRequest.js
// ================================
const mongoose = require('mongoose');
const ContactRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ContactRequest', ContactRequestSchema);