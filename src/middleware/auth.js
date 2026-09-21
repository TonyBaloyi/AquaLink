const ApiError = require('../utils/ApiError');
const { getUser } = require('../services/supabase-auth.service');
const env = require('../config/env');
const db = require('../config/db');

/** Authentication service - validates a Supabase Auth access token and loads the AquaLink user. */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing access token');

    const authUser = await getUser(token);
    if (!authUser) throw ApiError.unauthorized('Invalid or expired access token');

    const user = await db.one(
      `SELECT id, name, email, phone, role, status, last_login_at, created_at
       FROM users WHERE id = $1`, [authUser.id]
    );
    if (!user) throw ApiError.unauthorized('Account profile no longer exists');
    if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');

    req.authUser = authUser;
    req.user = user;
    next();
  } catch (err) { next(err); }
}

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Your role may not perform this action'));
  }
  next();
};

async function withSupplier(req, _res, next) {
  try {
    if (req.user.role !== 'supplier') return next();
    req.supplier = await db.one(`SELECT * FROM suppliers WHERE user_id = $1`, [req.user.id]);
    if (!req.supplier) throw ApiError.forbidden('No supplier profile linked to this account');
    next();
  } catch (err) { next(err); }
}

async function withHousehold(req, _res, next) {
  try {
    if (req.user.role !== 'household') return next();
    req.household = await db.one(`SELECT * FROM households WHERE user_id = $1`, [req.user.id]);
    if (!req.household) throw ApiError.forbidden('No household profile linked to this account');
    next();
  } catch (err) { next(err); }
}

function deviceAuth(req, _res, next) {
  const key = req.headers['x-device-key'];
  if (!key || key !== env.deviceApiKey) return next(ApiError.unauthorized('Invalid device key'));
  next();
}

module.exports = { authenticate, authorize, withSupplier, withHousehold, deviceAuth };
