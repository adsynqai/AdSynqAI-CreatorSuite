// routes/generate.js

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const fetch   = global.fetch || require('node-fetch');
const { spawn } = require('child_process');
const AdAttempt = require('../models/AdAttempt');
const OpenAI    = require('openai').OpenAI;

// Helpers
function splitPromptIntoSegments(prompt) {
  const sentences = prompt.split(/(?<=[.?!])\s+/).filter(s => s.trim());
  return sentences.map((text, idx) => ({ segmentId: idx+1, text, duration: null, startTime: null }));
}
function simulateDurations(segments) {
  let t = 0;
  return segments.map(seg => {
    const d = Math.max(2, Math.min(6, seg.text.length/15));
    const out = { ...seg, duration: d, startTime: t };
    t += d + 0.5;
    return out;
  });
}

// Clients & config
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ELEVEN_KEY   = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID;
const FFMPEG_PATH  = process.env.FFMPEG_PATH;
const BASE_OUT     = path.join(__dirname, '..', 'output');

router.post('/', async (req, res) => {
  const { userId, promoName, prompt, imageStyle, voiceStyle, type } = req.body;
  if (!userId || !promoName || !prompt || type !== 'video') {
    return res.status(400).json({ error: 'Missing required fields or unsupported type' });
  }

  // load or create ad record
  let ad = await AdAttempt.findOne({ userId, promoName });
  if (!ad) ad = new AdAttempt({ userId, promoName, prompt, type });
  ad.attemptCount++;

  // -- IMAGE --
  let imagePath, imageUrl;
  try {
    const imgResp = await openai.images.generate({ prompt: `${prompt}, style: ${imageStyle||'default'}`, n:1, size:'512x512', response_format:'b64_json' });
    const b64 = imgResp.data[0].b64_json;
    const imgName = `image_${Date.now()}.png`;
    const imgDir  = path.join(BASE_OUT, 'images', userId);
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir,{recursive:true});
    fs.writeFileSync(path.join(imgDir, imgName), Buffer.from(b64,'base64'));
    imagePath = path.join('output','images', userId, imgName);
    imageUrl  = `${req.protocol}://${req.get('host')}/images/${userId}/${imgName}`;
    ad.imagePath = imagePath; await ad.save();
  } catch(err) {
    console.error('IMAGE ERROR',err);
    return res.status(500).json({ error:'Image generation failed', details:err.message });
  }

  // -- AUDIO --
  let audioPath, audioUrl;
  try {
    const audDir = path.join(BASE_OUT,'audio',userId);
    if (!fs.existsSync(audDir)) fs.mkdirSync(audDir,{recursive:true});
    const audName = `audio_${Date.now()}.mp3`;
    const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`;
    const resp = await fetch(elevenUrl,{ method:'POST', headers:{'Content-Type':'application/json','xi-api-key':ELEVEN_KEY}, body:JSON.stringify({text:prompt}) });
    if(!resp.ok) throw new Error(await resp.text());
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(path.join(audDir,audName), buf);
    audioPath = path.join('output','audio',userId,audName);
    audioUrl  = `${req.protocol}://${req.get('host')}/audio/${userId}/${audName}`;
    ad.audioPath = audioPath; ad.audioAttempts++; await ad.save();
  } catch(err) {
    console.error('AUDIO ERROR',err);
    return res.status(500).json({ error:'Voice generation failed', details:err.message });
  }

  // -- VIDEO via FFmpeg --
  let videoPath, syncMap;
  try {
    const segs = splitPromptIntoSegments(prompt);
    syncMap = simulateDurations(segs);
    const vidDir = path.join(BASE_OUT,'videos',userId);
    if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir,{recursive:true});
    const vidName = `${promoName}_${Date.now()}.mp4`;
    const fullVid = path.join(vidDir, vidName);
    const relVid  = path.join('output','videos',userId,vidName);
    // write sync map
    fs.writeFileSync(path.join(vidDir,`${promoName}_syncMap.json`), JSON.stringify(syncMap,null,2));

    // spawn FFmpeg
    await new Promise((resolve,reject) => {
      const imgFile = path.resolve(__dirname,'..',imagePath);
      const audFile = path.resolve(__dirname,'..',audioPath);
      const args = ['-y','-loop','1','-i',imgFile,'-i',audFile,'-c:v','libx264','-tune','stillimage','-c:a','aac','-b:a','192k','-pix_fmt','yuv420p','-shortest',fullVid];
      const ff = spawn(FFMPEG_PATH,args,{stdio:'inherit'});
      ff.on('error',reject);
      ff.on('exit',code=> code===0?resolve():reject(new Error(`FFmpeg exit ${code}`)));
    });
    videoPath = relVid;
    ad.videoPath = videoPath; ad.syncMap = syncMap; ad.videoAttempts++; await ad.save();
  } catch(err) {
    console.error('VIDEO ERROR',err);
    return res.status(500).json({ error:'Video rendering failed', details:err.message });
  }

  // final payload
  res.json({ message:'✅ Composite ad generated', image:{imagePath,imageUrl}, voice:{audioPath,audioUrl}, video:{videoPath,syncMap}, userId,promoName });
});

module.exports = router;
