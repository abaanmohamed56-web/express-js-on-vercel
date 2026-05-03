// routes/crypto.js
const express = require(‘express’);
const router  = express.Router();

router.post(’/create-payment’,         (req, res) => res.json({ message: ‘Crypto payments coming soon’ }));
router.get(’/payment-status/:id’,      (req, res) => res.json({ message: ‘Crypto payments coming soon’ }));

module.exports = router;
