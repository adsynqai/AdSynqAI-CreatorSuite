const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/generate-image-ad
router.post('/generate-image-ad', async (req, res) => {
  const { visual_hook, style = 'realistic', userId, promoName } = req.body;

  if (!visual_hook || !userId || !promoName) {
    return res.status(400).json({ error: 'Missing required fields: visual_hook, userId, promoName' });
  }

  try {
    const response = await openai.images.generate({
      prompt: `${visual_hook}, style: ${style}, high resolution`,
      n: 1,
      size: '1024x1024'
    });

    const image_url = response.data?.[0]?.url;

    if (!image_url) {
      return res.status(500).json({ error: 'Image generation failed' });
    }

    return res.status(200).json({
      success: true,
      userId,
      promoName,
      image_url,
      promptUsed: `${visual_hook}, style: ${style}`
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({ error: 'OpenAI image generation failed', details: error.message });
  }
});

module.exports = router;
