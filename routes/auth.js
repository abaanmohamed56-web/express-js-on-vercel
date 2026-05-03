// routes/auth.js
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { query } = require('../database/db');
const { sendPasswordResetEmail } = require('../services/email');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path:     '/',
};

function issueToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '7d';
  const maxAge    = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const token     = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn });
  return { token, maxAge };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash   = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name`,
      [email, hash, full_name]
    );

    const user              = result.rows[0];
    const { token, maxAge } = issueToken(user);

    res.cookie('token', token, { ...COOKIE_OPTS, maxAge });
    res.status(201).json({ user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error('[POST /api/auth/register]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user  = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { token, maxAge } = issueToken(user, rememberMe);

    res.cookie('token', token, { ...COOKIE_OPTS, maxAge });
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ success: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  // Always return the same message to prevent email enumeration
  const genericMsg = { message: 'If that email exists, a reset link has been sent.' };

  try {
    const { email } = req.body;
    if (!email) return res.json(genericMsg);

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.json(genericMsg);

    const userId    = result.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user, then insert new one
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, resetToken, expiresAt]
    );

    await sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err.message);
  }

  res.json(genericMsg);
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const result = await query(
      `SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const userId = result.rows[0].user_id;
    const hash   = await bcrypt.hash(password, 12);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
