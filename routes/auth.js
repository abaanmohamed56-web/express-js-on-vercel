// routes/auth.js
const express = require(‘express’);
const router  = express.Router();
const bcrypt  = require(‘bcrypt’);
const jwt     = require(‘jsonwebtoken’);
const { query } = require(’../database/db’);

// POST /api/auth/register
router.post(’/register’, async (req, res) => {
try {
const { email, password, full_name } = req.body;
if (!email || !password) return res.status(400).json({ error: ‘Email and password required’ });

```
const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

const hash = await bcrypt.hash(password, 12);
const result = await query(
  `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name`,
  [email, hash, full_name]
);

const user  = result.rows[0];
const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

res.status(201).json({ token, user });
```

} catch (err) {
console.error(’[POST /api/auth/register]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

// POST /api/auth/login
router.post(’/login’, async (req, res) => {
try {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ error: ‘Email and password required’ });

```
const result = await query('SELECT * FROM users WHERE email = $1', [email]);
if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

const user  = result.rows[0];
const valid = await bcrypt.compare(password, user.password_hash);
if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
```

} catch (err) {
console.error(’[POST /api/auth/login]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

// POST /api/auth/forgot-password
router.post(’/forgot-password’, async (req, res) => {
res.json({ message: ‘If that email exists, a reset link has been sent.’ });
});

// POST /api/auth/reset-password
router.post(’/reset-password’, async (req, res) => {
res.json({ message: ‘Password reset functionality coming soon.’ });
});

module.exports = router;
