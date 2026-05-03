// routes/vip.js
// SkillPips VIP 2.0 — API routes for web ↔ bot integration

const express  = require('express');
const crypto   = require('crypto');
const router   = express.Router();
const { query } = require('../database/db');
const { grantVIPAccess } = require('../services/telegram');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/vip/status ──
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT telegram_user_id, telegram_username, payment_status, expiry_date, linked_at, invite_sent_at
       FROM vip_members WHERE user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.json({ telegramLinked: false, paymentStatus: 'none', expiryDate: null });
    }

    const m = result.rows[0];
    res.json({
      telegramLinked:   !!m.telegram_user_id,
      telegramUsername: m.telegram_username,
      paymentStatus:    m.payment_status,
      expiryDate:       m.expiry_date,
      linkedAt:         m.linked_at,
      inviteSent:       !!m.invite_sent_at,
    });
  } catch (err) {
    console.error('[GET /api/vip/status]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/vip/grant ──
// Internal endpoint — called after payment is confirmed.
// Protected by INTERNAL_SECRET header (never expose to frontend).
router.post('/grant', async (req, res) => {
  const secret         = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SECRET;

  if (!secret || !expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let authorized = false;
  try {
    authorized = crypto.timingSafeEqual(
      Buffer.from(secret),
      Buffer.from(expectedSecret)
    );
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!authorized) return res.status(401).json({ error: 'Unauthorized' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const result = await grantVIPAccess(userId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('[POST /api/vip/grant]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/vip/init ──
router.post('/init', authenticateToken, async (req, res) => {
  try {
    await query(
      `INSERT INTO vip_members (user_id, payment_status) VALUES ($1, 'pending') ON CONFLICT (user_id) DO NOTHING`,
      [req.user.id]
    );

    const deepLink = `https://t.me/skillpipsBot?start=link_${req.user.id}`;
    res.json({ success: true, telegramDeepLink: deepLink });
  } catch (err) {
    console.error('[POST /api/vip/init]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
