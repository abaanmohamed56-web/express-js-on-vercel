require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit  = require('express-rate-limit');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000'];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());

// Strict rate limiter for auth endpoints (5 req / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhooks must come before body parsing (raw body needed for signature checks)
app.use('/api/webhooks', require('../routes/webhooks'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/', (req, res) => res.json({ message: 'SkillPips API', version: '1.0.0' }));

app.use('/api/auth',   authLimiter, require('../routes/auth'));
app.use('/api/user',   apiLimiter,  require('../routes/user'));
app.use('/api/crypto', apiLimiter,  require('../routes/crypto'));
app.use('/api/bml',    apiLimiter,  require('../routes/bml'));
app.use('/api/vip',    apiLimiter,  require('../routes/vip'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

module.exports = app;
