// routes/vip.js
// SkillPips VIP 2.0 — API routes for web ↔ bot integration

const express = require(‘express’);
const router  = express.Router();
const { query } = require(’../database/db’);
const { grantVIPAccess } = require(’../services/telegram’);
const { authenticateToken } = require(’../middleware/auth’);

// ── GET /api/vip/status ──
// Returns logged-in user’s VIP membership + Telegram link status
// Used by frontend to show the “Connect Telegram” step and membership state
router.get(’/status’, authenticateToken, async (req, res) => {
try {
const result = await query(
`SELECT telegram_user_id, telegram_username, payment_status, expiry_date, linked_at, invite_sent_at FROM vip_members WHERE user_id = $1`,
[req.user.id]
);

```
if (!result.rows.length) {
  return res.json({
    telegramLinked:  false,
    paymentStatus:   'none',
    expiryDate:      null,
  });
}

const m = result.rows[0];
res.json({
  telegramLinked:   !!m.telegram_user_id,
  telegramUsername: m.telegram_username,
  paymentStatus:    m.payment_status,   // none | pending | active | expired
  expiryDate:       m.expiry_date,
  linkedAt:         m.linked_at,
  inviteSent:       !!m.invite_sent_at,
});
```

} catch (err) {
console.error(’[GET /api/vip/status]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

// ── POST /api/vip/grant ──
// Internal endpoint — called after payment is confirmed
// Protected by INTERNAL_SECRET header (never expose to frontend)
router.post(’/grant’, async (req, res) => {
const secret = req.headers[‘x-internal-secret’];
if (secret !== process.env.INTERNAL_SECRET) {
return res.status(401).json({ error: ‘Unauthorized’ });
}

const { userId } = req.body;
if (!userId) return res.status(400).json({ error: ‘userId required’ });

const result = await grantVIPAccess(userId);
res.status(result.success ? 200 : 400).json(result);
});

// ── POST /api/vip/init ──
// Called by frontend right after signup to create a pending vip_members row
// This ensures the row exists before the bot /start deep link fires
router.post(’/init’, authenticateToken, async (req, res) => {
try {
await query(
`INSERT INTO vip_members (user_id, payment_status) VALUES ($1, 'pending') ON CONFLICT (user_id) DO NOTHING`,
[req.user.id]
);

```
// Return the deep link the frontend should show to the user
const deepLink = `https://t.me/skillpipsBot?start=link_${req.user.id}`;
res.json({ success: true, telegramDeepLink: deepLink });
```

} catch (err) {
console.error(’[POST /api/vip/init]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

module.exports = router;
