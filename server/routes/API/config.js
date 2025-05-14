// ================================
// routes/API/config.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const auth = require('../../middleware/auth');

console.log('✅ config.js route file loaded');

// @route   GET /api/config
// @desc    Return app config settings for UI
// @access  Private
router.get('/', auth, (req, res) => {
  res.status(200).json({
    watermarkEnabled: true,
    uploadAllowed: req.user.role === 'agency' || req.user.role === 'admin',
    aiAssistantEnabled: true
  });
});

module.exports = router;
