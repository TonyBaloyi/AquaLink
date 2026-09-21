const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const gateway = require('../../services/payment.gateway');
const notifier = require('../../services/notification.service');

const BASE = `
  SELECT p.*, h.address, h.meter_number, u.name AS payer_name, u.email
  FROM payments p
  JOIN households h ON h.id = p.household_id
  LEFT JOIN users u ON u.id = h.user_id`;

async function list({ household_id, status, supplier_id, from, to, limit, offset }) {
  const where = [];
  const params = [];
  let join = '';
  if (household_id) { params.push(household_id); where.push(`p.household_id = $${params.length}`); }
  if (status)       { params.push(status);       where.push(`p.status = $${params.length}`); }
  if (from)         { params.push(from);         where.push(`p.created_at >= $${params.length}`); }
  if (to)           { params.push(to);           where.push(`p.created_at <= $${params.length}`); }
  if (supplier_id) {
    join = 'JOIN boreholes b ON b.id = h.borehole_id';
    params.push(supplier_id); where.push(`b.supplier_id = $${params.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(
    `SELECT COUNT(*)::int AS count FROM payments p
     JOIN households h ON h.id = p.household_id ${join} ${clause}`, params);

  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${join} ${clause} ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const payment = await db.one(`${BASE} WHERE p.id = $1`, [id]);
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

/** Raise an invoice (pending payment) for a household. */
const createInvoice = ({ household_id, subscription_id, amount, period_start, period_end }) => db.one(
  `INSERT INTO payments (household_id, subscription_id, amount, status, period_start, period_end)
   VALUES ($1,$2,$3,'pending',$4,$5) RETURNING *`,
  [household_id, subscription_id || null, amount, period_start || null, period_end || null]);

/**
 * Household starts paying an invoice - hands off to the external payment
 * gateway (3.2) and returns the redirect/checkout payload.
 */
async function initiate(paymentId, method) {
  const payment = await get(paymentId);
  if (payment.status === 'completed') throw ApiError.badRequest('This invoice is already paid');

  const checkout = await gateway.createCheckout({
    reference: `AQL-${payment.id.slice(0, 8).toUpperCase()}`,
    amount: payment.amount,
    email: payment.email,
    description: `AquaLink water subscription (${payment.period_start || 'once off'})`,
  });

  await db.query('UPDATE payments SET method = $1, reference = $2 WHERE id = $3',
    [method || 'mobile_money', checkout.reference, paymentId]);

  return { payment_id: paymentId, ...checkout };
}

/** Mark a payment as paid - called by the gateway webhook or by an admin. */
async function markPaid(id, { reference } = {}) {
  const payment = await get(id);
  if (payment.status === 'completed') return payment;

  const updated = await db.one(
    `UPDATE payments SET status='completed', paid_at=now(), reference=COALESCE($2, reference)
     WHERE id=$1 RETURNING *`, [id, reference || null]);

  // Reactivate a subscription that was suspended for non payment.
  if (payment.subscription_id) {
    await db.query(
      `UPDATE subscriptions SET status='active' WHERE id=$1 AND status='suspended'`,
      [payment.subscription_id]);
  }

  const household = await db.one(
    `SELECT u.id AS user_id FROM households h JOIN users u ON u.id = h.user_id WHERE h.id = $1`,
    [payment.household_id]);
  if (household) {
    await notifier.send({
      userId: household.user_id, channel: 'sms',
      body: `AquaLink: payment of R${payment.amount} received. Thank you.`,
    });
  }
  return updated;
}

async function markFailed(id) {
  await get(id);
  return db.one(`UPDATE payments SET status='failed' WHERE id=$1 RETURNING *`, [id]);
}

/** Webhook entry point - verifies the signature then settles the payment. */
async function handleWebhook(payload, headers) {
  const event = gateway.verifyWebhook(payload, headers);
  const payment = await db.one('SELECT id FROM payments WHERE reference = $1', [event.reference]);
  if (!payment) throw ApiError.notFound('Unknown payment reference');

  if (event.status === 'completed') return markPaid(payment.id, { reference: event.reference });
  if (event.status === 'failed') return markFailed(payment.id);
  return { ignored: true };
}

/** Invoices past their period end that are still unpaid. */
const overdue = () => db.many(
  `SELECT p.*, h.user_id FROM payments p
   JOIN households h ON h.id = p.household_id
   WHERE p.status = 'pending' AND p.period_end < CURRENT_DATE`);

module.exports = { list, get, createInvoice, initiate, markPaid, markFailed, handleWebhook, overdue };
