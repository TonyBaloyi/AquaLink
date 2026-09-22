const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const supabaseAuth = require('../../services/supabase-auth.service');

const BASE = `
  SELECT s.*, u.email AS user_email, u.status AS user_status,
         COUNT(DISTINCT b.id)::int AS borehole_count,
         COUNT(DISTINCT h.id)::int AS household_count
  FROM suppliers s
  LEFT JOIN users u     ON u.id = s.user_id
  LEFT JOIN boreholes b ON b.supplier_id = s.id
  LEFT JOIN households h ON h.borehole_id = b.id`;

async function list({ search, status, limit, offset }) {
  const where = [];
  const params = [];
  if (status) { params.push(status); where.push(`s.status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(s.name ILIKE $${params.length} OR s.village ILIKE $${params.length})`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(`SELECT COUNT(*)::int AS count FROM suppliers s ${clause}`, params);
  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${clause} GROUP BY s.id, u.email, u.status ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const supplier = await db.one(`${BASE} WHERE s.id = $1 GROUP BY s.id, u.email, u.status`, [id]);
  if (!supplier) throw ApiError.notFound('Supplier not found');
  supplier.boreholes = await db.many(
    `SELECT id, name, location, tank_capacity_litres, status FROM boreholes WHERE supplier_id = $1`, [id]);
  return supplier;
}

/**
 * Admin onboards a supplier (borehole owner). Optionally creates the login
 * account in the same transaction so the supplier can reach their dashboard.
 */
async function create(input) {
  let createdAuthUser = null;
  try {
    return await db.transaction(async (client) => {
      let userId = input.user_id || null;

      if (!userId && input.account) {
        const { rows: [dup] } = await client.query('SELECT id FROM users WHERE email = $1', [input.account.email]);
        if (dup) throw ApiError.conflict('An account with that email already exists');
        createdAuthUser = await supabaseAuth.createUser({
          email: input.account.email,
          password: input.account.password,
          name: input.name,
          phone: input.contact_phone,
          role: 'supplier',
          emailConfirm: true,
        });
        const { rows: [user] } = await client.query(
          `INSERT INTO users (id, name, email, phone, role)
           VALUES ($1,$2,$3,$4,'supplier') RETURNING id`,
          [createdAuthUser.id, input.name, input.account.email, input.contact_phone || null]
        );
        userId = user.id;
      }

      const { rows: [supplier] } = await client.query(
        `INSERT INTO suppliers (user_id, name, contact_phone, contact_email, village, region)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [userId, input.name, input.contact_phone || null, input.contact_email || null,
         input.village || null, input.region || null]
      );
      return supplier;
    });
  } catch (err) {
    if (createdAuthUser) {
      try { await supabaseAuth.deleteUser(createdAuthUser.id); } catch (cleanupError) {
        console.error('[suppliers] failed to clean up Supabase user:', cleanupError.message);
      }
    }
    throw err;
  }
}

async function update(id, input) {
  const current = await db.one('SELECT * FROM suppliers WHERE id = $1', [id]);
  if (!current) throw ApiError.notFound('Supplier not found');
  const m = { ...current, ...input };
  return db.one(
    `UPDATE suppliers SET name=$1, contact_phone=$2, contact_email=$3, village=$4, region=$5, status=$6
     WHERE id=$7 RETURNING *`,
    [m.name, m.contact_phone, m.contact_email, m.village, m.region, m.status, id]
  );
}

async function remove(id) {
  const res = await db.query('DELETE FROM suppliers WHERE id = $1', [id]);
  if (!res.rowCount) throw ApiError.notFound('Supplier not found');
}

/** Supplier dashboard summary (Presentation layer 1.2). */
async function dashboard(supplierId) {
  const totals = await db.one(
    `SELECT
       (SELECT COUNT(*)::int FROM boreholes WHERE supplier_id = $1) AS boreholes,
       (SELECT COUNT(*)::int FROM households h JOIN boreholes b ON b.id = h.borehole_id
         WHERE b.supplier_id = $1) AS households,
       (SELECT COUNT(*)::int FROM alerts a JOIN boreholes b ON b.id = a.borehole_id
         WHERE b.supplier_id = $1 AND a.status = 'open') AS open_alerts`,
    [supplierId]);

  const flow = await db.one(
    `SELECT COALESCE(SUM(r.litres_supplied),0)::float AS litres_today
     FROM sensor_readings r
     JOIN sensors s  ON s.id = r.sensor_id
     JOIN boreholes b ON b.id = s.borehole_id
     WHERE b.supplier_id = $1 AND r.recorded_at >= date_trunc('day', now())`, [supplierId]);

  const income = await db.one(
    `SELECT COALESCE(SUM(p.amount),0)::float AS income_this_month
     FROM payments p
     JOIN households h ON h.id = p.household_id
     JOIN boreholes b  ON b.id = h.borehole_id
     WHERE b.supplier_id = $1 AND p.status = 'completed'
       AND p.paid_at >= date_trunc('month', now())`, [supplierId]);

  const tanks = await db.many(
    `SELECT DISTINCT ON (b.id) b.id, b.name, b.tank_capacity_litres,
            r.water_level_percent, r.recorded_at
     FROM boreholes b
     LEFT JOIN sensors s ON s.borehole_id = b.id AND s.type = 'level'
     LEFT JOIN sensor_readings r ON r.sensor_id = s.id
     WHERE b.supplier_id = $1
     ORDER BY b.id, r.recorded_at DESC NULLS LAST`, [supplierId]);

  return { ...totals, ...flow, ...income, tanks };
}

module.exports = { list, get, create, update, remove, dashboard };
