const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/generate-full-ad', async (req, res) => {
  const {
    userId,
    promoName,
    imageStyle,
    audience,
    tone,
    format,
    industry,
    visual_hook,
    offer,
    call_to_action,
    personalization,
    highlights = []
  } = req.body;

  if (!userId || !promoName || !audience || !tone || !format || !industry || !offer || !call_to_action || !personalization) {
    return res.status(400).json({ error: 'Missing required top-level fields' });
  }

  const {
    agent_name,
    designation,
    brokerage_name,
    license_id,
    logo_url,
    contact_phone,
    contact_email,
    location
  } = personalization;

  if (!agent_name || !designation || !brokerage_name || !license_id || !logo_url || !contact_phone || !contact_email || !location) {
    return res.status(400).json({ error: 'Missing required personalization fields' });
  }

  try {
    // Validate logo URL
    await axios.head(logo_url);

    // Step 1: Generate Ad Text
    const textPrompt = `Generate a ${format} ad for a ${audience} in ${location}.
Industry: ${industry}
Tone: ${tone}
Offer: ${offer}
Highlights: ${highlights.join(', ')}
Visual Suggestion: ${visual_hook}
Call to Action: ${call_to_action}

Personalization:
- Agent: ${agent_name}, ${designation}
- Brokerage: ${brokerage_name}
- License ID: ${license_id}
- Contact: ${contact_phone}, ${contact_email}
- Logo: ${logo_url}

Ensure the ad is compliant, engaging, and tailored to this industry.`;

    const textResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert ad copywriter trained in regulated industries.' },
        { role: 'user', content: textPrompt }
      ]
    });

    const adText = textResponse.choices?.[0]?.message?.content;

    // Step 2: Generate Ad Image
    const imageResponse = await openai.images.generate({
      prompt: `${visual_hook}, style: ${imageStyle}, high resolution`,
      n: 1,
      size: '1024x1024'
    });

    const image_url = imageResponse.data?.[0]?.url;

    return res.status(200).json({
      success: true,
      text: adText,
      image_url,
      promptUsed: `${visual_hook}, style: ${imageStyle}`
    });
  } catch (error) {
    console.error('Full ad generation error:', error);
    return res.status(500).json({ error: 'Ad generation failed', details: error.message });
  }
});

module.exports = router;
