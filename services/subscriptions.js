// services/subscriptions.js
const { query } = require(’../database/db’);

// Called daily by cron — checks expired subscriptions and removes from VIP group
async function checkExpiredSubscriptions(bot) {
const now     = new Date();
const in3days = new Date(now.getTime() + 3 * 86_400_000);

// 1. Send 3-day renewal reminders
const expiringSoon = await query(
`SELECT user_id, telegram_user_id, expiry_date FROM vip_members WHERE payment_status = 'active' AND expiry_date <= $1 AND expiry_date >= $2`,
[in3days.toISOString(), now.toISOString()]
);

for (const m of expiringSoon.rows) {
if (!m.telegram_user_id || !bot) continue;
const expiryStr = new Date(m.expiry_date).toLocaleDateString(‘en-US’, {
month: ‘long’, day: ‘numeric’
});
await bot.sendMessage(m.telegram_user_id,
`⏳ SkillPips VIP Reminder\n\nYour membership expires on ${expiryStr}.\nRenew at ${process.env.FRONTEND_URL}/pricing to keep your access.`
).catch(console.error);
}

// 2. Remove expired members
const expired = await query(
`SELECT user_id, telegram_user_id FROM vip_members WHERE payment_status = 'active' AND expiry_date < $1`,
[now.toISOString()]
);

for (const m of expired.rows) {
// Update status
await query(
`UPDATE vip_members SET payment_status = 'expired' WHERE user_id = $1`,
[m.user_id]
);

```
if (!m.telegram_user_id || !bot) continue;

// Remove from VIP group
await bot.banChatMember(process.env.TELEGRAM_VIP_GROUP_ID, m.telegram_user_id).catch(console.error);
await bot.unbanChatMember(process.env.TELEGRAM_VIP_GROUP_ID, m.telegram_user_id).catch(console.error);

// Notify user
await bot.sendMessage(m.telegram_user_id,
  `❌ Your SkillPips VIP membership has expired and you've been removed from the group.\n\nRenew at ${process.env.FRONTEND_URL}/pricing to get back in.`
).catch(console.error);
```

}

console.log(`[subscriptions] Reminded: ${expiringSoon.rows.length}, Removed: ${expired.rows.length}`);
}

// Called daily — sends renewal reminders
async function sendRenewalReminders(bot) {
await checkExpiredSubscriptions(bot);
}

module.exports = { checkExpiredSubscriptions, sendRenewalReminders };
