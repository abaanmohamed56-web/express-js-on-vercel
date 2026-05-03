// database/db.js
const { Pool } = require(‘pg’);

const pool = new Pool({
host:     process.env.DB_HOST,
port:     parseInt(process.env.DB_PORT) || 5432,
database: process.env.DB_NAME,
user:     process.env.DB_USER,
password: process.env.DB_PASSWORD,
ssl:      process.env.NODE_ENV === ‘production’ ? { rejectUnauthorized: false } : false,
max: 10,
idleTimeoutMillis: 30000,
});

async function query(text, params) {
const start  = Date.now();
const result = await pool.query(text, params);
const dur    = Date.now() - start;
if (process.env.NODE_ENV === ‘development’) {
console.log(`[DB] ${dur}ms — ${text.slice(0, 60)}`);
}
return result;
}

module.exports = { pool, query };
