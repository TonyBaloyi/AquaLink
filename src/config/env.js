require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  dbSsl: process.env.DB_SSL === 'true',
  deviceApiKey: process.env.DEVICE_API_KEY || 'aqualink-device-key',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'payfast',
  notifyProvider: process.env.NOTIFY_PROVIDER || 'console',
  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
  lowTankThreshold: parseFloat(process.env.LOW_TANK_THRESHOLD || '20'),
  noFlowHours: parseInt(process.env.NO_FLOW_HOURS || '6', 10),
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()),
  passwordResetRedirectUrl: process.env.PASSWORD_RESET_REDIRECT_URL,
};

if (!env.databaseUrl) {
  console.warn('[config] DATABASE_URL is not set - copy .env.example to .env');
}

module.exports = env;
