const express = require('express');
const fs      = require('fs');
const path    = require('path');
const rateLimit  = require('express-rate-limit');
const AdAttempt  = require('../models/AdAttempt');

const router     = express.Router();
const USE_DB     = false;
const MAX_AUDIO  = parseInt(process.env.MAX_AUDIO_PER_AD, 10) || 3;
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID;

// Rate limiter
const voiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: MAX_AUDIO * 2,
  message: 'Too many audio requests; please try again later.'
});
router.use('/', voiceLimiter);

router.post('/', async (req, res) => {
  const { userId, promoName, prompt, voiceStyle } = req.body;
  if (!userId || !promoName || !prompt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Load or create AdAttempt
  let ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) {
    ad = new AdAttempt({ userId, promoName, prompt, type: 'voice' });
  }

  // Enforce cap
  if (ad.audioAttempts >= MAX_AUDIO) {
    return res.status(429).json({ error: `Audio limit of ${MAX_AUDIO} reached` });
  }

  // Prepare output folder
  const folder = path.join(__dirname, '..', 'output', 'audio', userId);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const audioName     = `audio_${Date.now()}.mp3`;
  const fullAudioPath = path.join(folder, audioName);
  const audioPathDB   = path.join('output', 'audio', userId, audioName);

  // Call ElevenLabs
  try {
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`,
      {
        method: 'POST',
        headers: { 'Content-Type':'application/json','xi-api-key':ELEVEN_KEY },
        body: JSON.stringify({ text: prompt })
      }
    );
    if (!resp.ok) throw new Error(await resp.text());
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(fullAudioPath, buf);
  } catch (err) {
    console.error('❌ TTS error:', err);
    return res.status(500).json({ error: 'Voice generation failed', details: err.message });
  }

  // Persist and bump
  ad.audioPath      = audioPathDB;
  ad.audioAttempts += 1;
  await ad.save();

  // Return URL
  const audioUrl = `${req.protocol}://${req.get('host')}/audio/${userId}/${audioName}`;
  res.json({ message: '✅ Voice generated', audioUrl, audioPath: audioPathDB, userId, promoName, voiceStyle: voiceStyle||'default' });
});

// ✅ Finalize Voice Ad
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

  res.json({ message: '✅ Voice ad finalized', isFinal: true, finalizedAt: ad.finalizedAt });
});

module.exports = router;