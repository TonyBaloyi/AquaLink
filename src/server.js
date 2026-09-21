const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const scheduler = require('./jobs/scheduler');

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[db] connected');
  } catch (err) {
    console.error('[db] connection failed:', err.message);
  }

  const server = app.listen(env.port, () => {
    console.log(`[api] AquaLink running on http://localhost:${env.port}${env.apiPrefix}`);
    scheduler.start();
  });

  const shutdown = (signal) => {
    console.log(`\n[api] ${signal} received, shutting down`);
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));
})();
