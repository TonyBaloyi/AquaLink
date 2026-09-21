const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const supabaseAuth = require('../../services/supabase-auth.service');

const BASE = `
  SELECT h.*, u.name AS contact_name, u.email, u.phone,
         b.name AS borehole_name, b.supplier_id,
         sub.status AS subscription_status, sub.monthly_fee
  FROM households h
  LEFT JOIN users u ON u.id = h.user_id
  LEFT JOIN boreholes b ON b.id = h.borehole_id
  LEFT JOIN subscriptions sub ON sub.household_id = h.id AND sub.status = 'active'`;

async function list({ search, borehole_id, supplier_id, status, limit, offset }) {
  const where = [];
  const params = [];
  if (borehole_id) { params.push(borehole_id); where.push(`h.borehole_id = $${params.length}`); }
  if (supplier_id) { params.push(supplier_id); where.push(`b.supplier_id = $${params.length}`); }
  if (status)      { params.push(status);      where.push(`h.status = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(h.address ILIKE $${params.length} OR h.meter_number ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(
    `SELECT COUNT(*)::int AS count FROM households h
     LEFT JOIN users u ON u.id = h.user_id
     LEFT JOIN boreholes b ON b.id = h.borehole_id ${clause}`, params);

  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${clause} ORDER BY h.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const household = await db.one(`${BASE} WHERE h.id = $1`, [id]);
  if (!household) throw ApiError.notFound('Household not found');
  return household;
}

/** Admin registers a household, optionally creating its login account. */
async function create(input) {
  let createdAuthUser = null;
  try {
    return await db.transaction(async (client) => {
      let userId = input.user_id || null;
      if (!userId && input.account) {
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [input.account.email]);
        if (existing.rowCount) throw ApiError.conflict('An account with that email already exists');
        createdAuthUser = await supabaseAuth.createUser({
          email: input.account.email,
          password: input.account.password,
          name: input.account.name,
          phone: input.account.phone,
          role: 'household',
          emailConfirm: true,
        });
        const { rows: [user] } = await client.query(
          `INSERT INTO users (id, name, email, phone, role)
           VALUES ($1,$2,$3,$4,'household') RETURNING id`,
          [createdAuthUser.id, input.account.name, input.account.email, input.account.phone || null]);
        userId = user.id;
      }
      const { rows: [household] } = await client.query(
        `INSERT INTO households (user_id, borehole_id, address, village, household_size, meter_number)
         VALUES ($1,$2,$3,$4,COALESCE($5,1),$6) RETURNING *`,
        [userId, input.borehole_id || null, input.address, input.village || null,
         input.household_size, input.meter_number || null]);
      return household;
    });
  } catch (err) {
    if (createdAuthUser) {
      try { await supabaseAuth.deleteUser(createdAuthUser.id); } catch (cleanupError) {
        console.error('[households] failed to clean up Supabase user:', cleanupError.message);
      }
    }
    throw err;
  }
}

async function update(id, input) {
  const current = await db.one('SELECT * FROM households WHERE id = $1', [id]);
  if (!current) throw ApiError.notFound('Household not found');
  const m = { ...current, ...input };
  return db.one(
    `UPDATE households SET borehole_id=$1, address=$2, village=$3, household_size=$4,
            meter_number=$5, status=$6 WHERE id=$7 RETURNING *`,
    [m.borehole_id, m.address, m.village, m.household_size, m.meter_number, m.status, id]);
}

async function remove(id) {
  const res = await db.query('DELETE FROM households WHERE id = $1', [id]);
  if (!res.rowCount) throw ApiError.notFound('Household not found');
}

/** Household portal summary (Presentation layer 1.1). */
async function summary(householdId) {
  const household = await get(householdId);

  const usage = await db.one(
    `SELECT
       COALESCE(SUM(litres_supplied) FILTER (WHERE recorded_at >= date_trunc('day', now())),0)::float   AS litres_today,
       COALESCE(SUM(litres_supplied) FILTER (WHERE recorded_at >= date_trunc('month', now())),0)::float AS litres_this_month
     FROM sensor_readings WHERE household_id = $1`, [householdId]);

  const payment = await db.one(
    `SELECT id, amount, status, paid_at, period_end
     FROM payments WHERE household_id = $1 ORDER BY created_at DESC LIMIT 1`, [householdId]);

  const outstanding = await db.one(
    `SELECT COALESCE(SUM(amount),0)::float AS outstanding
     FROM payments WHERE household_id = $1 AND status = 'pending'`, [householdId]);

  const alerts = await db.many(
    `SELECT id, type, severity, message, created_at FROM alerts
     WHERE (household_id = $1 OR borehole_id = $2) AND status = 'open'
     ORDER BY created_at DESC LIMIT 10`, [householdId, household.borehole_id]);

  return { household, usage, latest_payment: payment, ...outstanding, alerts };
}

/** Ownership guard used by the household portal. */
function assertSelf(req, householdId) {
  if (req.user.role === 'household' && req.household.id !== householdId) {
    throw ApiError.forbidden('You may only view your own household');
  }
}

module.exports = { list, get, create, update, remove, summary, assertSelf };
