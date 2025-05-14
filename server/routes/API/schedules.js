// ================================
// routes/API/schedules.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const Schedule = require('../../models/schedule');
const auth = require('../../middleware/auth');


console.log('✅ schedules.js route file loaded');

// @route   POST /api/scheduler/create
// @desc    Create a new ad schedule
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { adId, scheduledAt } = req.body;
    const newSchedule = new Schedule({
      userId: req.user.id,
      adId,
      scheduledAt
    });
    await newSchedule.save();
    res.status(200).json({ message: 'Ad scheduled successfully.' });
  } catch (err) {
    console.error('❌ Schedule Create Error:', err);
    res.status(500).json({ error: 'Error scheduling ad.' });
  }
});

// @route   GET /api/scheduler/upcoming
// @desc    Get upcoming schedules for a user
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const schedules = await Schedule.find({
      userId: req.user.id,
      scheduledAt: { $gte: now }
    }).populate('adId');
    res.status(200).json(schedules);
  } catch (err) {
    console.error('❌ Schedule Fetch Error:', err);
    res.status(500).json({ error: 'Error fetching schedules.' });
  }
});

// @route   DELETE /api/scheduler/delete/:id
// @desc    Delete a scheduled ad by ID
// @access  Private
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await Schedule.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.status(200).json({ message: 'Schedule deleted successfully.' });
  } catch (err) {
    console.error('❌ Schedule Delete Error:', err);
    res.status(500).json({ error: 'Error deleting schedule.' });
  }
});

module.exports = router;
