// app.js – AdSynq AI Creator Suite Backend

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// ✅ Route files
const videoRoutes = require('./routes/video');
const assetRoutes = require('./routes/assets');
const imageRoutes = require('./routes/image'); // ✅ NEW - Image generation endpoint

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP if needed for external assets
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adsynqai')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ✅ Static Assets – for generated media
app.use('/static', express.static(path.join(__dirname, 'output')));

// ✅ API Routes
app.use('/api/video', videoRoutes);   // POST to generate/finalize video
app.use('/api/assets', assetRoutes);  // GET assets per user
app.use('/api/image', imageRoutes);   // POST to generate image via OpenAI DALL·E

// ✅ Newly added business logic routes
console.log('✅ Registering /api/ad routes...');
app.use('/api/v1/ad', require('./routes/API/ads'));
app.use('/api/v1/user', require('./routes/API/users'));
app.use('/api/v1/lead', require('./routes/API/leads'));
app.use('/api/v1/scheduler', require('./routes/API/schedules'));
app.use('/api/v1/feedback', require('./routes/API/feedback'));
app.use('/api/v1/contact', require('./routes/API/contact'));
app.use('/api/v1/config', require('./routes/API/config'));
app.use('/api/v1/compliance', require('./routes/API/compliance'));

// ✅ Health Check Route
app.get('/', (req, res) => {
  res.send('AdSynq AI Creator Suite Backend is running 🚀');
});

// ✅ Debug/Info Routes – only for non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug', (req, res) => res.send('✅ Debug route is working'));
  app.get('/info', (req, res) => {
    res.json({
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      mongo: process.env.MONGODB_URI,
    });
  });
}

// ✅ Swagger Docs Setup
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swaggerSpec');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unexpected error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});