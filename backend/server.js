const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config(); // Fallback to .env

const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const authRoutes = require('./routes/auth');
const googleAdsRoutes = require('./routes/googleads');
const clicksRoutes = require('./routes/clicks');
const detectionRoutes = require('./routes/detection');
const quietIndexRoutes = require('./routes/quietindex');
const reportsRoutes = require('./routes/reports');
const anomaliesRoutes = require('./routes/anomalies');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/googleads', googleAdsRoutes);
app.use('/api/clicks', clicksRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/qi', quietIndexRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/anomalies', anomaliesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Debug endpoint - בדוק משתני סביבה (לא לפרודקשן!)
app.get('/api/debug/env', (req, res) => {
  res.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...' || 'missing'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Test Supabase Connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Try to query users table (should be empty now)
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    res.json({ 
      status: 'connected',
      message: 'Supabase מחובר בהצלחה!',
      tables: {
        users: count
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔥 Clicks API ready!`);
  console.log(`🚨 Detection Engine ready!`);
  console.log(`📊 Quiet Index ready!`);
  console.log(`📄 Reports API ready!`);
  console.log(`🔍 Anomalies API ready!`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

