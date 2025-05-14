require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Asset = require('../models/Asset');
const AdAttempt = require('../models/AdAttempt');
const { canRetryAd } = require('../utils/adUtils');
const { normalizeUserId } = require('../utils/userUtils');

const ffmpegPath = process.env.FFMPEG_PATH;

const generateVideo = async (req, res) => {
  try {
    const { imagePath, audioPath, prompt, promoName, userId } = req.body;

    if (!imagePath || !audioPath) {
      return res.status(400).json({ error: 'Image and audio paths are required' });
    }

    if (!promoName) {
      return res.status(400).json({ error: 'Promo name is required' });
    }

    const normalizedUserId = normalizeUserId(userId);

    // 📂 Ensure output directory for user
    const outputBaseDir = path.join(__dirname, '../output');
    const userDir = path.join(outputBaseDir, normalizedUserId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // 🔁 Track ad attempts
    let attemptDoc = await AdAttempt.findOne({ userId: normalizedUserId, promoName });

    if (attemptDoc?.isFinal) {
      return res.status(403).json({
        error: 'Ad already finalized.',
        message: 'You have finalized this ad. Start a new one to continue.'
      });
    }

    if (!canRetryAd(attemptDoc)) {
      return res.status(403).json({
        error: 'Max attempts reached for this ad.',
        message: 'You’ve used all 3 attempts for this ad. Please upgrade or start a new ad.'
      });
    }

    if (attemptDoc) {
      attemptDoc.attemptCount += 1;
      await attemptDoc.save();
    } else {
      attemptDoc = await AdAttempt.create({ userId: normalizedUserId, promoName, prompt });
    }

    // 🎞️ Generate temporary file path
    const tempFileName = `temp_${Date.now()}.mp4`;
    const tempOutputPath = path.join(userDir, tempFileName);

    // ▶ FFmpeg command
    const command = `"${ffmpegPath}" -loop 1 -framerate 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -y "${tempOutputPath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ FFmpeg error:', error.message);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath); // Cleanup temp file
        return res.status(500).json({ error: 'Video generation failed', details: error.message });
      }

      // 🔢 Get version after video is ready
      const latestAsset = await Asset.findOne({
        userId: normalizedUserId,
        promoName,
        type: 'video'
      }).sort({ version: -1 });

      const newVersion = latestAsset ? latestAsset.version + 1 : 1;

      // 🏷️ Rename to final file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = promoName.replace(/\s+/g, '_').toLowerCase();
      const finalFileName = `${safeName}_v${newVersion}_${timestamp}.mp4`;
      const finalOutputPath = path.join(userDir, finalFileName);
      fs.renameSync(tempOutputPath, finalOutputPath);

      // 💾 Store metadata
      const assetEntry = await Asset.create({
        userId: normalizedUserId,
        promoName,
        type: 'video',
        prompt: prompt || 'N/A',
        filePath: finalOutputPath,
        language: 'en',
        version: newVersion,
        createdAt: new Date()
      });

      console.log('✅ Video generated and metadata stored.');

      res.json({
        videoPath: finalOutputPath,
        prompt: assetEntry.prompt,
        version: assetEntry.version,
        attemptCount: attemptDoc.attemptCount,
        attemptsRemaining: 3 - attemptDoc.attemptCount
      });
    });

  } catch (err) {
    console.error('❌ Video service error:', err);
    res.status(500).json({ error: 'Video generation failed', details: err.message });
  }
};

module.exports = { generateVideo };