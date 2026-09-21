const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const notifier = require('../../services/notification.service');

const BASE = `
  SELECT a.*, b.name AS borehole_name, h.address AS household_address, s.serial_number
  FROM alerts a
  LEFT JOIN boreholes b ON b.id = a.borehole_id
  LEFT JOIN households h ON h.id = a.household_id
  LEFT JOIN sensors s ON s.id = a.sensor_id`;

/**
 * Alert Management - creates an alert and pushes a notification.
 * De-duplicates: an identical open alert is not raised twice.
 */
async function raise({ sensor_id, borehole_id, household_id, type, severity = 'warning', message }) {
  const duplicate = await db.one(
    `SELECT id FROM alerts
     WHERE type = $1 AND status = 'open'
       AND COALESCE(borehole_id::text,'') = COALESCE($2::text,'')
       AND COALESCE(household_id::text,'') = COALESCE($3::text,'')`,
    [type, borehole_id || null, household_id || null]);
  if (duplicate) return duplicate;

  const alert = await db.one(
    `INSERT INTO alerts (sensor_id, borehole_id, household_id, type, severity, message)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sensor_id || null, borehole_id || null, household_id || null, type, severity, message]);

  await notifyStakeholders(alert);
  return alert;
}

/** Notification Service (3.2) - supplier for infrastructure, household for service. */
async function notifyStakeholders(alert) {
  const recipients = [];

  if (alert.borehole_id) {
    const supplier = await db.one(
      `SELECT u.id FROM boreholes b JOIN suppliers s ON s.id = b.supplier_id
       JOIN users u ON u.id = s.user_id WHERE b.id = $1`, [alert.borehole_id]);
    if (supplier) recipients.push(supplier.id);
  }
  if (alert.household_id) {
    const household = await db.one(
      `SELECT user_id FROM households WHERE id = $1`, [alert.household_id]);
    if (household?.user_id) recipients.push(household.user_id);
  }

  for (const userId of recipients) {
    await notifier.send({
      userId, channel: 'sms',
      subject: `AquaLink alert: ${alert.type}`,
      body: alert.message,
    });
  }
}

async function list({ status, type, severity, supplier_id, household_id, limit, offset }) {
  const where = [];
  const params = [];
  if (status)       { params.push(status);   where.push(`a.status = $${params.length}`); }
  if (type)         { params.push(type);     where.push(`a.type = $${params.length}`); }
  if (severity)     { params.push(severity); where.push(`a.severity = $${params.length}`); }
  if (household_id) { params.push(household_id); where.push(`a.household_id = $${params.length}`); }
  if (supplier_id)  { params.push(supplier_id);  where.push(`b.supplier_id = $${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(
    `SELECT COUNT(*)::int AS count FROM alerts a
     LEFT JOIN boreholes b ON b.id = a.borehole_id ${clause}`, params);

  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${clause} ORDER BY a.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const alert = await db.one(`${BASE} WHERE a.id = $1`, [id]);
  if (!alert) throw ApiError.notFound('Alert not found');
  return alert;
}

async function setStatus(id, status) {
  await get(id);
  return db.one(
    `UPDATE alerts SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE NULL END
     WHERE id = $2 RETURNING *`, [status, id]);
}

module.exports = { raise, list, get, setStatus };
