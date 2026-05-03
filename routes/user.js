// routes/user.js
const express = require(‘express’);
const router  = express.Router();
const { query } = require(’../database/db’);
const { authenticateToken } = require(’../middleware/auth’);

// GET /api/user/dashboard
router.get(’/dashboard’, authenticateToken, async (req, res) => {
try {
const result = await query(
`SELECT u.id, u.email, u.full_name, u.subscription_status, u.subscription_expiry, v.telegram_user_id, v.telegram_username, v.payment_status as vip_status FROM users u LEFT JOIN vip_members v ON v.user_id = u.id WHERE u.id = $1`,
[req.user.id]
);
res.json(result.rows[0] || {});
} catch (err) {
res.status(500).json({ error: ‘Server error’ });
}
});

// GET /api/user/subscription
router.get(’/subscription’, authenticateToken, async (req, res) => {
try {
const result = await query(
`SELECT subscription_status, subscription_plan, subscription_expiry FROM users WHERE id = $1`,
[req.user.id]
);
res.json(result.rows[0] || {});
} catch (err) {
res.status(500).json({ error: ‘Server error’ });
}
});

// GET /api/user/activity
router.get(’/activity’, authenticateToken, async (req, res) => {
try {
const result = await query(
`SELECT plan, amount, status, created_at FROM payment_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
[req.user.id]
);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: ‘Server error’ });
}
});

module.exports = router;
