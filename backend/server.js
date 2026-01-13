const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config(); // Fallback to .env

// Validate environment variables
const { validateEnv } = require('./src/config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const supabase = require('./config/supabase');
const { apiLimiter, authLimiter, reportLimiter } = require('./src/middleware/rateLimiter');

// Cron Jobs
console.log('🔄 Initializing cron jobs...');
require('./jobs/ingest-clicks');
require('./jobs/calculate-baseline');
require('./jobs/run-detection');
require('./jobs/generate-monthly-report');
console.log('✅ All cron jobs initialized');

// Routes
const authRoutes = require('./routes/auth');
const googleAdsRoutes = require('./routes/googleads');
const clicksRoutes = require('./routes/clicks');
const detectionRoutes = require('./routes/detection');
const quietIndexRoutes = require('./routes/quietindex');
const reportsRoutes = require('./routes/reports');
const anomaliesRoutes = require('./routes/anomalies');
const dashboardRoutes = require('./routes/dashboard');
const profilesRoutes = require('./routes/profiles');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || "https://*.supabase.co"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174'
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate Limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/reports/', reportLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Monitoring middleware (before routes)
const monitoringMiddleware = require('./src/middleware/monitoring');
const errorHandler = require('./src/middleware/errorHandler');
const MonitoringService = require('./src/services/MonitoringService');

app.use(monitoringMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/googleads', googleAdsRoutes);
app.use('/api/clicks', clicksRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/qi', quietIndexRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check endpoint (updated with MonitoringService)
app.get('/api/health', async (req, res) => {
  try {
    const health = await MonitoringService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = MonitoringService.getMetrics();
  res.json(metrics);
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

// Error handling middleware (use new error handler)
app.use(errorHandler);

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

