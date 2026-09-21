const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const supabaseAuth = require('../../services/supabase-auth.service');
const env = require('../../config/env');

const PUBLIC_FIELDS = 'id, name, email, phone, role, status, created_at, last_login_at';

function sessionPayload(session) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    expiresIn: session.expires_in,
    tokenType: session.token_type,
  };
}

async function createLocalUser(authUser, { name, email, phone, role = 'household', status = 'active' }) {
  return db.one(
    `INSERT INTO users (id, name, email, phone, role, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${PUBLIC_FIELDS}`,
    [authUser.id, name, email, phone || null, role, status]
  );
}

async function registerHousehold(input) {
  const existing = await db.one('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const authUser = await supabaseAuth.createUser({
    email: input.email,
    password: input.password,
    name: input.name,
    phone: input.phone,
    role: 'household',
    emailConfirm: true,
  });

  try {
    return await db.transaction(async (client) => {
      const { rows: [user] } = await client.query(
        `INSERT INTO users (id, name, email, phone, role, status)
         VALUES ($1,$2,$3,$4,'household','active') RETURNING ${PUBLIC_FIELDS}`,
        [authUser.id, input.name, input.email, input.phone || null]
      );
      const { rows: [household] } = await client.query(
        `INSERT INTO households (user_id, address, village, household_size, borehole_id, meter_number)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [authUser.id, input.address, input.village || null, input.household_size || 1,
         input.borehole_id || null, input.meter_number || null]
      );
      const session = await supabaseAuth.signIn(input.email, input.password);
      return { user, household, ...sessionPayload(session.session) };
    });
  } catch (err) {
    try { await supabaseAuth.deleteUser(authUser.id); } catch (cleanupError) {
      console.error('[auth] failed to clean up Supabase user:', cleanupError.message);
    }
    throw err;
  }
}

async function login({ email, password: plain, userType }) {
  const user = await db.one(`SELECT ${PUBLIC_FIELDS} FROM users WHERE email = $1`, [email]);
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (user.status === 'suspended') throw ApiError.forbidden('Account suspended, contact the administrator');
  if (userType && user.role !== userType) {
    throw ApiError.forbidden(`This account is not registered as a ${userType}`);
  }

  const session = await supabaseAuth.signIn(email, plain);
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

  const profile = await loadProfile(user);
  user.last_login_at = new Date().toISOString();
  return { user, profile, ...sessionPayload(session.session) };
}

async function loadProfile(user) {
  if (user.role === 'supplier') {
    return db.one(
      `SELECT s.*, COUNT(b.id)::int AS borehole_count
       FROM suppliers s LEFT JOIN boreholes b ON b.supplier_id = s.id
       WHERE s.user_id = $1 GROUP BY s.id`, [user.id]);
  }
  if (user.role === 'household') {
    return db.one(
      `SELECT h.*, b.name AS borehole_name, sub.status AS subscription_status
       FROM households h
       LEFT JOIN boreholes b ON b.id = h.borehole_id
       LEFT JOIN subscriptions sub ON sub.household_id = h.id AND sub.status = 'active'
       WHERE h.user_id = $1`, [user.id]);
  }
  return null;
}

async function me(user) {
  const profile = await loadProfile(user);
  return { user, profile };
}

async function refresh(refreshToken) {
  const session = await supabaseAuth.refresh(refreshToken);
  const user = await db.one(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [session.user.id]);
  if (!user) throw ApiError.unauthorized('Account profile no longer exists');
  if (user.status === 'suspended') throw ApiError.forbidden('Account suspended');
  return { user, profile: await loadProfile(user), ...sessionPayload(session.session) };
}

async function forgotPassword(email) {
  const redirectTo = env.passwordResetRedirectUrl || `${env.corsOrigin[0]}/reset-password`;
  await supabaseAuth.resetEmail(email, redirectTo);
  return { sent: true };
}

async function resetPassword({ accessToken, newPassword }) {
  if (!accessToken) throw ApiError.badRequest('accessToken is required');
  const authUser = await supabaseAuth.getUser(accessToken);
  if (!authUser) throw ApiError.unauthorized('Invalid or expired recovery session');
  await supabaseAuth.updatePassword(authUser.id, newPassword);
  return { reset: true };
}

async function logout(accessToken) {
  if (accessToken) await supabaseAuth.signOut(accessToken);
  return { message: 'Logged out' };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await db.one('SELECT email FROM users WHERE id = $1', [userId]);
  if (!user) throw ApiError.notFound('Account not found');
  await supabaseAuth.signIn(user.email, currentPassword);
  await supabaseAuth.updatePassword(userId, newPassword);
  return { changed: true };
}

module.exports = { registerHousehold, login, me, refresh, forgotPassword, resetPassword, changePassword, logout };
