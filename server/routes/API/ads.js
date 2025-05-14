// ================================
// routes/API/ads.js
// ================================
const express = require('express');
const path = require('path');
const router = express.Router();

const Ad = require('../../models/Ad'); // ✅ This works when index.js or app.js is in /server
console.log('🧩 Model path:', path.resolve(__dirname, '../../models/Ad')); // ✅ Debug log
const auth = require(path.resolve(__dirname, '../../middleware/auth'));

console.log('✅ ads.js route file loaded');

// @route   POST /api/v1/ad/save
// @desc    Save a new ad
// @access  Private
router.post('/save', auth, async (req, res) => {
  console.log('✅ /api/v1/ad/save route HIT');
  try {
    const { type, content, category } = req.body;
    const newAd = new Ad({
      userId: req.user.id,
      type,
      content,
      category
    });
    await newAd.save();
    res.status(200).json({ message: 'Ad saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving ad:', err.message);
    res.status(500).json({ error: 'Error saving ad.' });
  }
});

// @route   GET /api/v1/ad/history
// @desc    Get ad history for the authenticated user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const ads = await Ad.find({ userId: req.user.id, isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (err) {
    console.error('❌ Error fetching ad history:', err.message);
    res.status(500).json({ error: 'Error fetching ad history.' });
  }
});

// @route   DELETE /api/v1/ad/delete/:id
// @desc    Soft delete an ad by ID
// @access  Private
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const ad = await Ad.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: true },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.status(200).json({ message: 'Ad deleted successfully.' });
  } catch (err) {
    console.error('❌ Error deleting ad:', err.message);
    res.status(500).json({ error: 'Error deleting ad.' });
  }
});

module.exports = router;
