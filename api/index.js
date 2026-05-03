require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use('/api/webhooks', require('../routes/webhooks'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/', (req, res) => res.json({ message: 'SkillPips API', version: '1.0.0' }));

app.use('/api/auth',     require('../routes/auth'));
app.use('/api/user',     require('../routes/user'));
app.use('/api/crypto',   require('../routes/crypto'));
app.use('/api/bml',      require('../routes/bml'));
app.use('/api/vip',      require('../routes/vip'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

module.exports = app;
