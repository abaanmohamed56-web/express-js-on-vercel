// routes/webhooks.js
const express  = require('express');
const crypto   = require('crypto');
const router   = express.Router();
const { grantVIPAccess } = require('../services/telegram');

// POST /api/webhooks/stripe  (kept as stub — Stripe not in use)
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  res.json({ received: true });
});

// POST /api/webhooks/nowpayments
router.post('/nowpayments', express.json(), async (req, res) => {
  // Verify HMAC-SHA512 signature from NOWPayments
  const sig = req.headers['x-nowpayments-sig'];
  if (!sig || !process.env.NOWPAYMENTS_IPN_SECRET) {
    return res.status(401).json({ error: 'Missing signature or IPN secret not configured' });
  }

  const hmac = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
    .update(JSON.stringify(req.body, Object.keys(req.body).sort()))
    .digest('hex');

  let sigValid = false;
  try {
    sigValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmac));
  } catch {
    return res.status(401).json({ error: 'Invalid signature format' });
  }

  if (!sigValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const { payment_status, order_id } = req.body;

    // Validate order_id is a non-empty string with UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (payment_status === 'finished' && order_id && UUID_RE.test(String(order_id))) {
      await grantVIPAccess(order_id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[webhook/nowpayments]', err.message);
    res.status(500).json({ error: 'Webhook error' });
  }
});

module.exports = router;
