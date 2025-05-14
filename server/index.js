// index.js – Consolidated Entry Point for AdSynq AI Backend

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Core Logic Routes
const uploadImageRoute = require('./routes/uploadImage');
const renderAdImageRoute = require('./routes/renderAdImage');
const generateFullAdRoute = require('./routes/generateFullAd');
const adGeneratorRoute = require('./routes/adGenerator');
const imageRoute = require('./routes/image');
const videoRoute = require('./routes/video');
const voiceRoute = require('./routes/voice');
const historyRoute = require('./routes/history');
const assetsRoute = require('./routes/assets');
const generateRoute = require('./routes/generate');
const authRoute = require('./routes/auth');
const generateImageAdRoute = require('./routes/generateImageAd');
const swaggerSpec = require('./swagger/swaggerSpec');

// App.js style business routes
const adsRoutes = require('./routes/API/ads');
const usersRoutes = require('./routes/API/users');
const leadsRoutes = require('./routes/API/leads');
const schedulerRoutes = require('./routes/API/schedules');
const feedbackRoutes = require('./routes/API/feedback');
const contactRoutes = require('./routes/API/contact');
const configRoutes = require('./routes/API/config');
const complianceRoutes = require('./routes/API/compliance');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Functionality Routes
app.use('/api', generateFullAdRoute);
app.use('/api', uploadImageRoute);
app.use('/api', adGeneratorRoute);
app.use('/api', generateImageAdRoute);
app.use('/api/image', imageRoute);
app.use('/api/video', videoRoute);
app.use('/api/voice', voiceRoute);
app.use('/api/history', historyRoute);
app.use('/api/assets', assetsRoute);
app.use('/api/generate', generateRoute);
app.use('/api/auth', authRoute);
app.use('/api', renderAdImageRoute);

// Business Logic Routes
console.log('✅ Registering AdSynq AI business routes...');
app.use('/api/v1/ad', adsRoutes);
app.use('/api/v1/user', usersRoutes);
app.use('/api/v1/lead', leadsRoutes);
app.use('/api/v1/scheduler', schedulerRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/compliance', complianceRoutes);

// Static Assets
app.use('/images', express.static(path.join(__dirname, 'output', 'images')));
app.use('/audio', express.static(path.join(__dirname, 'output', 'audio')));
app.use('/videos', express.static(path.join(__dirname, 'output', 'videos')));
app.use('/uploads', express.static(path.join(__dirname, 'output', 'uploads')));
app.use('/render-ad-image', express.static(path.join(__dirname, 'output', 'render-ad-image')));

// Health Check
app.get('/debug', (req, res) => {
  res.send('✅ Debug route is working');
});

app.get('/', (req, res) => {
  res.send('AdSynq AI Creator Suite Backend is running 🚀');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unexpected error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
