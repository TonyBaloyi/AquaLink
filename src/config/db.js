const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('[db] unexpected pool error', err));

/** Run a parameterised query. */
const query = (text, params) => pool.query(text, params);

/** Fetch a single row (or null). */
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;

/** Fetch all rows. */
const many = async (text, params) => (await pool.query(text, params)).rows;

/** Run several statements inside a transaction. */
async function transaction(handler) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, many, transaction };
