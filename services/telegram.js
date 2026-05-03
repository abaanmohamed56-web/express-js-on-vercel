// services/telegram.js
// SkillPips Telegram Bot — VIP 2.0 Integration

const TelegramBot = require(‘node-telegram-bot-api’);
const { query } = require(’../database/db’);

let bot;

function initializeTelegramBot() {
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error(‘TELEGRAM_BOT_TOKEN not set’);

bot = new TelegramBot(token, { polling: true });

// ── /start handler ──
// Handles both plain /start and deep links: /start link_USERID
bot.onText(//start(.*)/, async (msg, match) => {
const chatId  = msg.chat.id;
const tgId    = msg.from.id;
const tgUser  = msg.from.username ?? null;
const tgName  = msg.from.first_name ?? ‘there’;
const payload = match[1].trim(); // “link_abc123” or “”

```
// ── Deep link: link Telegram to web account ──
if (payload.startsWith('link_')) {
  const userId = payload.replace('link_', '');

  try {
    // Upsert vip_members record with Telegram identity
    await query(
      `INSERT INTO vip_members (user_id, telegram_user_id, telegram_username, linked_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET telegram_user_id  = EXCLUDED.telegram_user_id,
             telegram_username = EXCLUDED.telegram_username,
             linked_at         = NOW()`,
      [userId, tgId, tgUser]
    );

    // Check if they already paid before linking (send invite immediately)
    const result = await query(
      `SELECT payment_status, invite_sent_at FROM vip_members WHERE user_id = $1`,
      [userId]
    );

    const member = result.rows[0];

    await bot.sendMessage(chatId,
      `✅ Hey ${tgName}! Your Telegram is now linked to SkillPips.\n\n` +
      `Complete your payment on the website and I'll send your VIP invite link right here automatically.`
    );

    // If they paid before linking — send invite now
    if (member?.payment_status === 'active' && !member?.invite_sent_at) {
      await grantVIPAccess(userId);
    }

  } catch (err) {
    console.error('[bot /start link] Error:', err.message);
    await bot.sendMessage(chatId, '⚠️ Something went wrong. Please contact SkillPips support.');
  }

  return;
}

// ── Plain /start ──
await bot.sendMessage(chatId,
  `👋 Welcome to SkillPips Bot, ${tgName}!\n\n` +
  `Sign up at skillpips.com to get VIP 2.0 access.\n` +
  `Once registered, tap "Connect Telegram" on the site to link your account.`
);
```

});

// ── /status command ──
bot.onText(//status/, async (msg) => {
const chatId = msg.chat.id;
const tgId   = msg.from.id;

```
try {
  const result = await query(
    `SELECT payment_status, expiry_date FROM vip_members WHERE telegram_user_id = $1`,
    [tgId]
  );

  if (!result.rows.length) {
    return bot.sendMessage(chatId,
      `❌ No account linked.\n\nSign up at skillpips.com and connect your Telegram to get started.`
    );
  }

  const { payment_status, expiry_date } = result.rows[0];

  if (payment_status === 'active') {
    const expiryStr = new Date(expiry_date).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    return bot.sendMessage(chatId,
      `✅ Your VIP 2.0 membership is active.\n📅 Renews on ${expiryStr}\n\nNeed help? Visit skillpips.com`
    );
  }

  return bot.sendMessage(chatId,
    `⚠️ Your membership is ${payment_status}.\n\nRenew at skillpips.com to regain access.`
  );

} catch (err) {
  console.error('[bot /status] Error:', err.message);
  bot.sendMessage(chatId, '⚠️ Could not fetch your status. Please try again.');
}
```

});

// ── /renew command ──
bot.onText(//renew/, async (msg) => {
bot.sendMessage(msg.chat.id,
`🔄 Renew your SkillPips VIP membership here:\n👉 ${process.env.FRONTEND_URL}/pricing\n\nQuestions? Message us on the site.`
);
});

// ── /support command ──
bot.onText(//support/, (msg) => {
bot.sendMessage(msg.chat.id,
`🆘 SkillPips Support\n\nEmail: support@skillpips.com\nWebsite: ${process.env.FRONTEND_URL}\n\nWe typically respond within 24 hours.`
);
});

console.log(‘✅ Telegram Bot initialized with VIP 2.0 handlers’);
return bot;
}

// ── grantVIPAccess(userId) ──
// Call this after payment is confirmed to DM the user their VIP invite link
async function grantVIPAccess(userId) {
try {
// 1. Get member record
const result = await query(
`SELECT telegram_user_id, telegram_username, payment_status FROM vip_members WHERE user_id = $1`,
[userId]
);

```
if (!result.rows.length) {
  return { success: false, error: 'Member not found' };
}

const member = result.rows[0];

if (!member.telegram_user_id) {
  return { success: false, error: 'Telegram not linked yet' };
}

if (member.payment_status === 'active') {
  return { success: false, error: 'Already active' };
}

// 2. Generate single-use invite link (expires in 24h)
const expireUnix  = Math.floor(Date.now() / 1000) + 86_400;
const inviteResult = await bot.createChatInviteLink(
  process.env.TELEGRAM_VIP_GROUP_ID,
  { member_limit: 1, expire_date: expireUnix }
);
const inviteLink = inviteResult.invite_link;

// 3. Update DB — mark as active
const expiryDate = new Date();
expiryDate.setMonth(expiryDate.getMonth() + 1);

await query(
  `UPDATE vip_members
   SET payment_status  = 'active',
       payment_date    = NOW(),
       expiry_date     = $1,
       invite_link     = $2,
       invite_sent_at  = NOW()
   WHERE user_id = $3`,
  [expiryDate.toISOString(), inviteLink, userId]
);

// 4. DM the invite link
const expiryStr = expiryDate.toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
});

await bot.sendMessage(
  member.telegram_user_id,
  `🎉 Payment confirmed — Welcome to SkillPips VIP 2.0!\n\n` +
  `Tap to join your exclusive group:\n👉 ${inviteLink}\n\n` +
  `⚠️ This link is single-use and expires in 24 hours.\n` +
  `📅 Your membership renews on ${expiryStr}.\n\n` +
  `Use /status anytime to check your membership.`
);

console.log(`[VIP] Access granted → userId ${userId} | tgId ${member.telegram_user_id}`);
return { success: true, expiry: expiryDate.toISOString() };
```

} catch (err) {
console.error(’[grantVIPAccess] Error:’, err.message);
return { success: false, error: err.message };
}
}

// ── revokeVIPAccess(userId) ──
// Removes user from VIP group and notifies them
async function revokeVIPAccess(userId) {
try {
const result = await query(
`SELECT telegram_user_id FROM vip_members WHERE user_id = $1`,
[userId]
);

```
if (!result.rows.length || !result.rows[0].telegram_user_id) {
  return { success: false, error: 'No Telegram ID found' };
}

const tgId = result.rows[0].telegram_user_id;

// Kick from group then unban so they can rejoin after renewal
await bot.banChatMember(process.env.TELEGRAM_VIP_GROUP_ID, tgId);
await bot.unbanChatMember(process.env.TELEGRAM_VIP_GROUP_ID, tgId);

await query(
  `UPDATE vip_members SET payment_status = 'expired' WHERE user_id = $1`,
  [userId]
);

await bot.sendMessage(tgId,
  `❌ Your SkillPips VIP membership has expired and you've been removed from the group.\n\n` +
  `Renew anytime at ${process.env.FRONTEND_URL}/pricing to get back in.`
);

return { success: true };
```

} catch (err) {
console.error(’[revokeVIPAccess] Error:’, err.message);
return { success: false, error: err.message };
}
}

function getBot() {
return bot;
}

module.exports = { initializeTelegramBot, grantVIPAccess, revokeVIPAccess, getBot };
