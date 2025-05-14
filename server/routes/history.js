const express = require('express');
const router = express.Router();
const AdAttempt = require('../models/AdAttempt');
const { Parser } = require('json2csv'); // For CSV export

// ✅ 1. GET: All Ad History (Wrapped for React UI)
router.get('/', async (req, res) => {
  try {
    const history = await AdAttempt.find().sort({ createdAt: -1 });
    res.json({ records: history });
  } catch (err) {
    console.error('❌ History fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ✅ 2. GET: Lookup by promoName (optionally filtered by userId)
router.get('/:promoName', async (req, res) => {
  const { promoName } = req.params;
  const { userId } = req.query;

  if (!promoName) {
    return res.status(400).json({ error: 'Missing promoName parameter' });
  }

  const filter = {
    promoName: { $regex: new RegExp(promoName, 'i') },
  };
  if (userId) filter.userId = userId;

  try {
    const record = await AdAttempt.findOne(filter);
    if (!record) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    return res.status(200).json(record);
  } catch (err) {
    console.error('❌ Promo lookup error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch promo details', details: err.message });
  }
});

// ✅ 3. GET: Export All History as CSV
router.get('/export/all', async (req, res) => {
  try {
    const data = await AdAttempt.find().lean();

    const fields = [
      'userId',
      'promoName',
      'type',
      'attemptCount',
      'isFinal',
      'imagePath',
      'audioPath',
      'videoPath',
      'finalizedAt',
      'createdAt'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`ad_history_export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('❌ Export error:', err.message);
    return res.status(500).json({ error: 'Failed to export history', details: err.message });
  }
});

module.exports = router;