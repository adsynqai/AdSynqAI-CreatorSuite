// ================================
// routes/API/contact.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const ContactRequest = require('../../models/contactRequest');
const auth = require('../../middleware/auth');

console.log('✅ contact.js route file loaded');

// @route   POST /api/contact/request
// @desc    Submit a contact request from the app
// @access  Private
router.post('/request', auth, async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = new ContactRequest({
      name,
      email,
      message,
      userId: req.user.id
    });
    await contact.save();
    res.status(200).json({ message: 'Contact request submitted successfully.' });
  } catch (err) {
    console.error('❌ Contact Submission Error:', err);
    res.status(500).json({ error: 'Server error while submitting contact request.' });
  }
});

module.exports = router;
