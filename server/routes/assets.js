const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

// GET /api/assets?userId=...&type=...&promoName=...&page=1&limit=10&search=...
router.get('/', async (req, res) => {
  try {
    const { userId, type, promoName, page = 1, limit = 10, search } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (promoName) query.promoName = promoName;
    if (search) {
      query.prompt = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Asset.countDocuments(query);

    res.json({
      assets,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('❌ Failed to fetch assets:', error.message);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

module.exports = router;