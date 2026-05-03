// routes/bml.js
// SkillPips — BML (Bank of Maldives) Payment Routes

const express = require(‘express’);
const router  = express.Router();
const { query } = require(’../database/db’);
const { grantVIPAccess } = require(’../services/telegram’);
const { authenticateToken } = require(’../middleware/auth’);

// ── POST /api/bml/initiate ──
// Frontend calls this to start a BML payment session
// Returns payment details for the user to complete
router.post(’/initiate’, authenticateToken, async (req, res) => {
try {
const { plan } = req.body; // ‘vip_early_bird’ | ‘vip_standard’ | ‘videos’

```
const pricing = {
  vip_early_bird: { amount: 6.74,  label: 'VIP 2.0 — Early Bird (50% off)', recurring: true  },
  vip_standard:   { amount: 13.49, label: 'VIP 2.0 — Monthly',              recurring: true  },
  videos:         { amount: 75.00, label: 'Strategy Video Pack',             recurring: false },
};

const selected = pricing[plan];
if (!selected) return res.status(400).json({ error: 'Invalid plan' });

// Log payment initiation
const result = await query(
  `INSERT INTO payment_logs (user_id, plan, amount, status, created_at)
   VALUES ($1, $2, $3, 'pending', NOW())
   RETURNING id`,
  [req.user.id, plan, selected.amount]
);

res.json({
  paymentId:   result.rows[0].id,
  amount:      selected.amount,
  label:       selected.label,
  recurring:   selected.recurring,
  // BML payment reference — use your BML merchant portal details
  bmlMerchantId:  process.env.BML_MERCHANT_ID,
  bmlApiKey:      process.env.BML_API_KEY,
  reference:      `SP-${result.rows[0].id}`,
});
```

} catch (err) {
console.error(’[POST /api/bml/initiate]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

// ── POST /api/bml/confirm ──
// Called by admin OR BML webhook when payment is manually confirmed
// For manual USDT/BML confirmations: use x-admin-key header
router.post(’/confirm’, async (req, res) => {
const adminKey = req.headers[‘x-admin-key’];
const bmlSig   = req.headers[‘x-bml-signature’];

// Must have either admin key OR valid BML webhook signature
const isAdmin  = adminKey === process.env.ADMIN_KEY;
const isBMLWebhook = bmlSig && verifyBMLSignature(req.body, bmlSig);

if (!isAdmin && !isBMLWebhook) {
return res.status(401).json({ error: ‘Unauthorized’ });
}

const { paymentId, userId, plan } = req.body;
if (!userId) return res.status(400).json({ error: ‘userId required’ });

try {
// 1. Update payment log
await query(
`UPDATE payment_logs SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1`,
[paymentId]
);

```
// 2. Update user subscription in users table
const expiryDate = new Date();
expiryDate.setMonth(expiryDate.getMonth() + 1);

await query(
  `UPDATE users
   SET subscription_status  = 'active',
       subscription_plan    = $1,
       subscription_expiry  = $2,
       updated_at           = NOW()
   WHERE id = $3`,
  [plan || 'vip', expiryDate.toISOString(), userId]
);

// 3. Grant VIP Telegram access
const vipResult = await grantVIPAccess(userId);

if (!vipResult.success && vipResult.error === 'Telegram not linked yet') {
  // Paid but hasn't linked Telegram — they'll get the invite when they link
  console.log(`[BML] User ${userId} paid, Telegram not linked yet. Will send on link.`);
}

console.log(`[BML] Payment confirmed for user ${userId}`);
res.json({ success: true, vipGranted: vipResult.success });
```

} catch (err) {
console.error(’[POST /api/bml/confirm]’, err.message);
res.status(500).json({ error: ‘Server error’ });
}
});

// ── Signature verification helper ──
// Update this with your actual BML webhook signature method
function verifyBMLSignature(body, signature) {
// TODO: implement BML webhook signature verification
// Most payment gateways use HMAC-SHA256
// const crypto = require(‘crypto’);
// const expected = crypto.createHmac(‘sha256’, process.env.BML_WEBHOOK_SECRET)
//   .update(JSON.stringify(body)).digest(‘hex’);
// return expected === signature;
return false; // disabled until BML webhook secret is configured
}

module.exports = router;
