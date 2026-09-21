const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// ---------- plans ----------
const listPlans = (activeOnly = true) => db.many(
  `SELECT * FROM subscription_plans ${activeOnly ? 'WHERE is_active = TRUE' : ''} ORDER BY monthly_fee`);

const createPlan = (input) => db.one(
  `INSERT INTO subscription_plans (name, monthly_fee, litres_included, rate_per_extra_litre, description)
   VALUES ($1,$2,COALESCE($3,0),COALESCE($4,0),$5) RETURNING *`,
  [input.name, input.monthly_fee, input.litres_included, input.rate_per_extra_litre, input.description || null]);

async function updatePlan(id, input) {
  const current = await db.one('SELECT * FROM subscription_plans WHERE id = $1', [id]);
  if (!current) throw ApiError.notFound('Plan not found');
  const m = { ...current, ...input };
  return db.one(
    `UPDATE subscription_plans SET name=$1, monthly_fee=$2, litres_included=$3,
            rate_per_extra_litre=$4, description=$5, is_active=$6 WHERE id=$7 RETURNING *`,
    [m.name, m.monthly_fee, m.litres_included, m.rate_per_extra_litre, m.description, m.is_active, id]);
}

// ---------- subscriptions ----------
const BASE = `
  SELECT s.*, p.name AS plan_name, p.litres_included,
         h.address, h.meter_number, h.borehole_id
  FROM subscriptions s
  JOIN subscription_plans p ON p.id = s.plan_id
  JOIN households h ON h.id = s.household_id`;

async function list({ household_id, status, supplier_id, limit, offset }) {
  const where = [];
  const params = [];
  if (household_id) { params.push(household_id); where.push(`s.household_id = $${params.length}`); }
  if (status)       { params.push(status);       where.push(`s.status = $${params.length}`); }
  let join = '';
  if (supplier_id) {
    join = 'JOIN boreholes b ON b.id = h.borehole_id';
    params.push(supplier_id); where.push(`b.supplier_id = $${params.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${join} ${clause} ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count: rows.length };
}

async function get(id) {
  const sub = await db.one(`${BASE} WHERE s.id = $1`, [id]);
  if (!sub) throw ApiError.notFound('Subscription not found');
  return sub;
}

/** Household chooses a water plan - one active subscription per household. */
async function subscribe({ household_id, plan_id }) {
  const plan = await db.one('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE', [plan_id]);
  if (!plan) throw ApiError.badRequest('That plan is not available');

  const active = await db.one(
    `SELECT id FROM subscriptions WHERE household_id = $1 AND status = 'active'`, [household_id]);
  if (active) throw ApiError.conflict('This household already has an active subscription');

  return db.transaction(async (client) => {
    const { rows: [sub] } = await client.query(
      `INSERT INTO subscriptions (household_id, plan_id, status, monthly_fee, next_billing_date)
       VALUES ($1,$2,'active',$3, CURRENT_DATE + INTERVAL '1 month') RETURNING *`,
      [household_id, plan_id, plan.monthly_fee]);

    // First invoice is raised immediately as a pending payment.
    await client.query(
      `INSERT INTO payments (household_id, subscription_id, amount, status, period_start, period_end)
       VALUES ($1,$2,$3,'pending', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')`,
      [household_id, sub.id, plan.monthly_fee]);

    return sub;
  });
}

/** Change plan, suspend, resume or cancel. */
async function changeStatus(id, status) {
  const sub = await get(id);
  const endDate = status === 'cancelled' ? 'CURRENT_DATE' : 'end_date';
  return db.one(
    `UPDATE subscriptions SET status = $1, end_date = ${endDate} WHERE id = $2 RETURNING *`,
    [status, sub.id]);
}

async function changePlan(id, planId) {
  const plan = await db.one('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE', [planId]);
  if (!plan) throw ApiError.badRequest('That plan is not available');
  await get(id);
  return db.one(
    `UPDATE subscriptions SET plan_id = $1, monthly_fee = $2 WHERE id = $3 RETURNING *`,
    [planId, plan.monthly_fee, id]);
}

/** Used by the billing job: subscriptions due for their monthly invoice. */
const dueForBilling = () => db.many(
  `SELECT * FROM subscriptions WHERE status = 'active' AND next_billing_date <= CURRENT_DATE`);

module.exports = {
  listPlans, createPlan, updatePlan,
  list, get, subscribe, changeStatus, changePlan, dueForBilling,
};
