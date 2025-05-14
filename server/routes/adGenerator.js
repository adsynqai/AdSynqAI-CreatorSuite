const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/generate-ad', async (req, res) => {
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

  // Step 1: Validate required fields
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

  // Step 2: Optional - verify logo URL is valid
  try {
    await axios.head(logo_url);
  } catch {
    return res.status(400).json({ error: 'Invalid logo URL' });
  }

  // Step 3: Construct prompt
  const prompt = `Generate a ${format} ad for a ${audience} in ${location}.
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

  // Step 4: Call OpenAI
  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert ad copywriter trained in regulated industries.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = aiResponse.choices?.[0]?.message?.content;
    return res.status(200).json({ success: true, content });
  } catch (error) {
    console.error('OpenAI error:', error);
    return res.status(500).json({ error: 'Ad generation failed', details: error.message });
  }
});

module.exports = router;