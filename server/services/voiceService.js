require('dotenv').config(); // Ensure env variables are loaded

const ffmpegPath = process.env.FFMPEG_PATH;

const axios = require('axios');

const generateVoice = async (req, res) => {
  try {
    const { text, language } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Rachel (default)

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      responseType: 'stream',
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename=output.mp3',
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('❌ Voice generation failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Voice generation failed' });
  }
};

module.exports = { generateVoice };