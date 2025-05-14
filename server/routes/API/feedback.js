// ================================
// routes/API/feedback.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const Feedback = require('../../models/feedback');  // ✅ correct
const auth = require('../../middleware/auth');

console.log('✅ feedback.js route file loaded');

// @route   POST /api/feedback/submit
// @desc    Submit feedback for an ad
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {
    const { rating, message, adRef } = req.body;
    const feedback = new Feedback({
      userId: req.user.id,
      rating,
      message,
      adRef
    });
    await feedback.save();
    res.status(200).json({ message: 'Feedback submitted successfully.' });
  } catch (err) {
    console.error('❌ Feedback Submit Error:', err);
    res.status(500).json({ error: 'Error submitting feedback.' });
  }
});

module.exports = router;
