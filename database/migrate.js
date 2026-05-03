// database/migrate.js
// Run with: node database/migrate.js

const { pool } = require(’./db’);

async function migrate() {
const client = await pool.connect();

try {
await client.query(‘BEGIN’);
console.log(‘🔄 Running migrations…’);

```
// ── Users table ──
await client.query(`
  CREATE TABLE IF NOT EXISTS users (
    id                  UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    email               TEXT    UNIQUE NOT NULL,
    password_hash       TEXT    NOT NULL,
    full_name           TEXT,
    subscription_status TEXT    DEFAULT 'inactive'
                        CHECK (subscription_status IN ('inactive','active','expired','cancelled')),
    subscription_plan   TEXT,
    subscription_expiry TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('  ✅ users');

// ── VIP Members table ──
// Links web accounts to Telegram for automated invite delivery
await client.query(`
  CREATE TABLE IF NOT EXISTS vip_members (
    id                  UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             UUID    REFERENCES users(id) ON DELETE CASCADE,

    -- Telegram identity
    telegram_user_id    BIGINT,
    telegram_username   TEXT,
    linked_at           TIMESTAMPTZ,

    -- VIP access state
    payment_status      TEXT    DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','active','expired','cancelled')),
    payment_date        TIMESTAMPTZ,
    expiry_date         TIMESTAMPTZ,

    -- Invite tracking
    invite_link         TEXT,
    invite_sent_at      TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id),
    UNIQUE(telegram_user_id)
  );
`);
console.log('  ✅ vip_members');

// ── Payment logs table ──
await client.query(`
  CREATE TABLE IF NOT EXISTS payment_logs (
    id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID    REFERENCES users(id) ON DELETE SET NULL,
    plan            TEXT,
    amount          NUMERIC(10,2),
    currency        TEXT    DEFAULT 'USD',
    method          TEXT,   -- 'bml' | 'usdt' | 'stripe'
    status          TEXT    DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','failed','refunded')),
    reference       TEXT,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('  ✅ payment_logs');

// ── Indexes ──
await client.query(`
  CREATE INDEX IF NOT EXISTS idx_vip_expiry
    ON vip_members (payment_status, expiry_date);
  CREATE INDEX IF NOT EXISTS idx_vip_telegram
    ON vip_members (telegram_user_id);
`);
console.log('  ✅ indexes');

await client.query('COMMIT');
console.log('\n✅ All migrations completed successfully.\n');
```

} catch (err) {
await client.query(‘ROLLBACK’);
console.error(‘❌ Migration failed:’, err.message);
throw err;
} finally {
client.release();
await pool.end();
}
}

migrate().catch(console.error);
