require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stripeRoutes = require('./routes/stripe');
const cryptoRoutes = require('./routes/crypto');
const bmlRoutes = require('./routes/bml');
const webhookRoutes = require('./routes/webhooks');

// Import services
const { initializeTelegramBot } = require('./services/telegram');
const { checkExpiredSubscriptions } = require('./services/subscriptions');
const { pool } = require('./database/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Webhook routes (MUST be before express.json() middleware)
// Stripe webhooks need raw body
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/bml', bmlRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Skill Pips API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Stripe errors
  if (err.type === 'StripeCardError') {
    return res.status(400).json({ 
      error: 'Payment failed',
      message: err.message 
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: err.message 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Authentication failed' 
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize Telegram Bot
let bot;
try {
  bot = initializeTelegramBot();
  console.log('✅ Telegram Bot initialized');
} catch (error) {
  console.error('❌ Failed to initialize Telegram Bot:', error.message);
}

// Cron Jobs
// Check for expired subscriptions daily at midnight UTC
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running daily subscription expiry check...');
  try {
    await checkExpiredSubscriptions(bot);
    console.log('✅ Subscription check completed');
  } catch (error) {
    console.error('❌ Subscription check failed:', error);
  }
});

// Send renewal reminders at 6 AM UTC
cron.schedule('0 6 * * *', async () => {
  console.log('📧 Sending renewal reminders...');
  try {
    const { sendRenewalReminders } = require('./services/subscriptions');
    await sendRenewalReminders(bot);
    console.log('✅ Renewal reminders sent');
  } catch (error) {
    console.error('❌ Failed to send reminders:', error);
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🔥 SKILL PIPS API SERVER RUNNING   ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                        
║  Environment: ${process.env.NODE_ENV}
║  Database: ${process.env.DB_NAME}
║  URL: http://localhost:${PORT}
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = { app, bot };
