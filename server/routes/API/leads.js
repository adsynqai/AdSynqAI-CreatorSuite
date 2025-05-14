// ================================
// routes/API/leads.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const Lead = require('../../models/lead');
const auth = require('../../middleware/auth');


console.log('✅ leads.js route file loaded');

// @route   POST /api/lead/add
// @desc    Add a new lead
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const { name, email, phone, tags, source } = req.body;
    const newLead = new Lead({
      userId: req.user.id,
      name,
      email,
      phone,
      tags,
      source
    });
    await newLead.save();
    res.status(200).json({ message: 'Lead added successfully.' });
  } catch (err) {
    console.error('❌ Lead Add Error:', err);
    res.status(500).json({ error: 'Error adding lead.' });
  }
});

// @route   GET /api/lead/list
// @desc    List all leads for the authenticated user
// @access  Private
router.get('/list', auth, async (req, res) => {
  try {
    const leads = await Lead.find({ userId: req.user.id });
    res.status(200).json(leads);
  } catch (err) {
    console.error('❌ Lead List Error:', err);
    res.status(500).json({ error: 'Error fetching leads.' });
  }
});

module.exports = router;
