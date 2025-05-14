const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { OpenAI } = require('openai');
const rateLimit  = require('express-rate-limit');
const AdAttempt  = require('../models/AdAttempt');

const router    = express.Router();
const USE_DB    = false;
const MAX_IMAGE = parseInt(process.env.MAX_IMAGE_PER_AD, 10) || 3;

// Rate limiter (optional)
const imageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: MAX_IMAGE * 2,
  message: 'Too many image requests; please try again later.'
});
router.use('/', imageLimiter);

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { userId, promoName, prompt, imageStyle } = req.body;
  if (!userId || !promoName || !prompt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Load or create AdAttempt
  let ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) {
    ad = new AdAttempt({ userId, promoName, prompt, type: 'image' });
  }

  // Enforce cap
  if (ad.imageAttempts >= MAX_IMAGE) {
    return res.status(429).json({
      error: `Image generation limit of ${MAX_IMAGE} reached for this promo`
    });
  }

  // Prepare output folder
  const folderPath = path.join(__dirname, '..', 'output', 'images', userId);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  // File paths
  const imageName      = `image_${Date.now()}.png`;
  const fullImagePath  = path.join(folderPath, imageName);
  const imagePathForDB = path.join('output', 'images', userId, imageName);

  // Generate image
  let b64;
  try {
    const response = await openai.images.generate({
      prompt: `${prompt}, style: ${imageStyle || 'default'}, photo-realistic, ultra-detailed faces, studio lighting`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });
    b64 = response.data[0].b64_json;
  } catch (err) {
    console.error('❌ OpenAI image error:', err);
    return res.status(500).json({ error: 'Image generation failed', details: err.message });
  }

  // Write to disk
  try {
    fs.writeFileSync(fullImagePath, Buffer.from(b64, 'base64'));
  } catch (err) {
    console.error('❌ File write error:', err);
    return res.status(500).json({ error: 'Failed to save image', details: err.message });
  }

  // Persist and increment
  ad.imagePath      = imagePathForDB;
  ad.imageAttempts += 1;
  await ad.save();

  // Return URL
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${userId}/${imageName}`;
  res.json({ message: '✅ Image generated', imageUrl, imagePath: imagePathForDB, userId, promoName, style: imageStyle || 'default' });
});
// ✅ Finalize Image Ad
router.post('/finalize', async (req, res) => {
  const { userId, promoName } = req.body;
  if (!userId || !promoName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  if (ad.isFinal) return res.status(409).json({ message: 'Already finalized' });

  ad.isFinal = true;
  ad.finalizedAt = new Date();
  await ad.save();

  res.json({ message: '✅ Image ad finalized', isFinal: true, finalizedAt: ad.finalizedAt });
});
module.exports = router;