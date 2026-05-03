// routes/webhooks.js
const express = require(‘express’);
const router  = express.Router();
const { grantVIPAccess } = require(’../services/telegram’);

// POST /api/webhooks/stripe
router.post(’/stripe’, express.raw({ type: ‘application/json’ }), async (req, res) => {
// TODO: Add Stripe webhook secret verification
res.json({ received: true });
});

// POST /api/webhooks/nowpayments
router.post(’/nowpayments’, async (req, res) => {
try {
const { payment_status, order_id } = req.body;

```
if (payment_status === 'finished' && order_id) {
  // order_id should be the userId
  await grantVIPAccess(order_id);
}

res.json({ received: true });
```

} catch (err) {
console.error(’[webhook/nowpayments]’, err.message);
res.status(500).json({ error: ‘Webhook error’ });
}
});

module.exports = router;
