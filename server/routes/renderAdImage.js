const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const FORMAT_MAP = {
  instagram_post: { width: 1024, height: 1024 },
  facebook_story: { width: 1080, height: 1920 },
  linkedin_ad: { width: 1200, height: 628 },
  facebook_post: { width: 1200, height: 628 },
  youtube_shorts: { width: 1080, height: 1920 },
  instagram_reel: { width: 1080, height: 1920 }
};

router.post('/render-ad-image', async (req, res) => {
  const {
    image_url,
    logo_url,
    agent_photo_url,
    agent_name,
    designation,
    license_id,
    contact_phone,
    contact_email,
    promoName = 'ad',
    userId = 'client',
    tone_overlay,
    platforms = ['instagram_post']
  } = req.body;

  if (!image_url || !logo_url || !agent_name || !designation || !license_id || !contact_phone || !contact_email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let bgResponse, logoResponse, photoResponse;

    try {
      bgResponse = await axios.get(image_url, {
  responseType: 'arraybuffer',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  },
  timeout: 5000 // Optional: Prevent long hanging
});

    } catch (err) {
       return res.status(503).json({
    error: 'Background image not reachable',
    details: err.message
  });
}

    try {
      logoResponse = await axios.get(logo_url, { responseType: 'arraybuffer' });
    } catch (err) {
      return res.status(503).json({ error: 'Logo image not reachable', details: err.message });
    }

    if (agent_photo_url) {
      try {
        photoResponse = await axios.get(agent_photo_url, { responseType: 'arraybuffer' });
      } catch (err) {
        return res.status(503).json({ error: 'Agent photo not reachable', details: err.message });
      }
    }

    const bgImage = await loadImage(bgResponse.data);
    const logo = await loadImage(logoResponse.data);
    const photo = photoResponse ? await loadImage(photoResponse.data) : null;

    const outputDir = path.join(__dirname, '..', 'output', 'render-ad-image');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const urls = [];

    for (const platform of platforms) {
      const format = FORMAT_MAP[platform];
      if (!format) continue;

      const canvas = createCanvas(format.width, format.height);
      const ctx = canvas.getContext('2d');

      // Draw background with auto-scaling
      const bgRatio = bgImage.width / bgImage.height;
      let drawW = format.width;
      let drawH = format.height;

      if (bgRatio > format.width / format.height) {
        drawH = format.height;
        drawW = bgRatio * format.height;
      } else {
        drawW = format.width;
        drawH = format.width / bgRatio;
      }

      const bgX = (format.width - drawW) / 2;
      const bgY = (format.height - drawH) / 2;
      ctx.drawImage(bgImage, bgX, bgY, drawW, drawH);

      // Overlay tone if applicable
      if (tone_overlay) {
        ctx.fillStyle = tone_overlay;
        ctx.fillRect(0, 0, format.width, format.height);
      }

      // Circular agent photo
      if (photo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(110, 110, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photo, 30, 30, 160, 160);
        ctx.restore();
      }

      // Logo (above CTA ribbon)
      const maxW = 180, maxH = 120;
      let lW = logo.width, lH = logo.height;
      const aspect = logo.width / logo.height;
      if (lW > maxW) { lW = maxW; lH = maxW / aspect; }
      if (lH > maxH) { lH = maxH; lW = maxH * aspect; }
      const padding = 20;
      const ctaHeight = 64;
      const spacingAboveCTA = 20;
      const logoX = format.width - lW - padding;
      const logoY = format.height - ctaHeight - spacingAboveCTA - lH;
      ctx.drawImage(logo, logoX, logoY, lW, lH);

      // Optional background behind text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(20, format.height - 340, 700, 220);

      // Smart white font with shadow
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const lines = [
        agent_name,
        designation,
        `License: ${license_id}`,
        contact_phone,
        contact_email
      ];

      let y = format.height - 300;
      for (const line of lines) {
        ctx.fillText(line, 40, y);
        y += 40;
      }

      // CTA ribbon
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d62828';
      ctx.fillRect(0, format.height - 64, format.width, 64);
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('BONUS: GET YOUR FIRST MORTGAGE CHECKLIST FREE!', 40, format.height - 20);

      const timestamp = Date.now();
      const filename = `${userId}_${promoName.replace(/\s+/g, '_')}_${platform.toUpperCase()}_${timestamp}.png`;
      const filepath = path.join(outputDir, filename);

      const out = fs.createWriteStream(filepath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      await new Promise(resolve => out.on('finish', resolve));

      urls.push(`/render-ad-image/${filename}`);
    }

    return res.status(200).json({ success: true, urls });
  } catch (error) {
    console.error('Render error:', error);
    return res.status(500).json({ error: 'Failed to render branded ad', details: error.message });
  }
});

module.exports = router;
