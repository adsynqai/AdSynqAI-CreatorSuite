const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { spawn } = require('child_process');
const AdAttempt = require('../models/AdAttempt');
const router    = express.Router();

function splitPromptIntoSegments(prompt) {
  return prompt.split(/(?<=[.?!])\s+/)
    .filter(s => s.trim())
    .map((txt, i) => ({ segmentId: i + 1, text: txt, duration: null, startTime: null }));
}

function simulateDurations(segs) {
  let t = 0;
  return segs.map(s => {
    const dur = Math.max(2, Math.min(6, s.text.length / 15));
    const out = { ...s, duration: dur, startTime: t };
    t += dur + 0.5;
    return out;
  });
}

// Ensure FFMPEG_PATH is set in .env
const FFMPEG_PATH = process.env.FFMPEG_PATH;

router.post('/', async (req, res) => {
  const { userId, promoName, prompt, type, imagePath, audioPath } = req.body;
  if (!userId || !promoName || !prompt || type !== 'video') {
    return res.status(400).json({ error: 'Missing required fields or unsupported type' });
  }

  // Load or create AdAttempt
  let ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) ad = new AdAttempt({ userId, promoName, prompt, type });
  ad.videoAttempts++;

  // Prepare folders and filenames
  const dir = path.join(__dirname, '..', 'output', 'videos', userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename  = `${promoName}_${Date.now()}.mp4`;
  const fullPath  = path.join(dir, filename);
  const relPath   = path.join('output', 'videos', userId, filename);

  // Create sync map
  const segments = splitPromptIntoSegments(prompt);
  const syncMap  = simulateDurations(segments);
  fs.writeFileSync(
    path.join(dir, `${promoName}_syncMap.json`),
    JSON.stringify(syncMap, null, 2)
  );

  // Run FFmpeg to combine image + audio into a valid MP4
  try {
    const imgInput = path.resolve(__dirname, '..', imagePath);
    const audInput = path.resolve(__dirname, '..', audioPath);

    const ffmpegArgs = [
      '-y',                   // overwrite
      '-loop', '1',           // loop image
      '-i', imgInput,         // image input
      '-i', audInput,         // audio input
      '-c:v', 'libx264',      // H.264 video codec
      '-tune', 'stillimage',  // optimize for still image
      '-c:a', 'aac',          // AAC audio codec
      '-b:a', '192k',         // audio bitrate
      '-pix_fmt', 'yuv420p',  // pixel format
      '-shortest',            // end with shortest stream (audio)
      fullPath                // output file
    ];

    await new Promise((resolve, reject) => {
      const ff = spawn(FFMPEG_PATH, ffmpegArgs, { stdio: 'inherit' });
      ff.on('error', reject);
      ff.on('exit', code => code === 0
        ? resolve()
        : reject(new Error(`FFmpeg exited with code ${code}`))
      );
    });
  } catch (err) {
    console.error('❌ FFmpeg error:', err);
    return res.status(500).json({ error: 'Video rendering failed', details: err.message });
  }

  // Persist paths
  ad.videoPath = relPath;
  ad.imagePath = imagePath;
  ad.audioPath = audioPath;
  ad.syncMap   = syncMap;
  await ad.save();

  // Respond
  res.json({
    message: '✅ Video created',
    videoPath: relPath,
    syncMap,
    userId,
    promoName,
    type
  });
});

// Finalize and status endpoints unchanged
router.post('/finalize', async (req, res) => {
  const { userId, promoName } = req.body;
  const ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  if (ad.isFinal) return res.status(409).json({ message: 'Already finalized' });

  ad.isFinal     = true;
  ad.finalizedAt = new Date();
  await ad.save();
  res.json({ message: '✅ Ad finalized', isFinal: true, finalizedAt: ad.finalizedAt });
});

router.get('/status', async (req, res) => {
  const { userId, promoName } = req.query;
  const ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) return res.status(404).json({ error: 'Not found' });
  res.json({ isFinal: ad.isFinal || false, attemptCount: ad.attemptCount || 0 });
});

module.exports = router;
