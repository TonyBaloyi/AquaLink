const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

(async () => {
  const fresh = process.argv.includes('--fresh');
  try {
    if (fresh) {
      console.log('[migrate] dropping schema...');
      await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    }
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('[migrate] schema applied');
  } catch (err) {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
