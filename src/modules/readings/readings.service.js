const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const alerts = require('../alerts/alerts.service');
const env = require('../../config/env');

/**
 * Water Usage Management - ingest a reading from a flow or level sensor.
 * Devices call this over HTTP/MQTT bridge with the X-Device-Key header.
 */
async function ingest({ serial_number, litres_supplied, water_level_percent, recorded_at }) {
  const sensor = await db.one(
    `SELECT s.*, b.tank_capacity_litres FROM sensors s
     JOIN boreholes b ON b.id = s.borehole_id WHERE s.serial_number = $1`, [serial_number]);
  if (!sensor) throw ApiError.notFound(`No sensor registered with serial ${serial_number}`);
  if (sensor.status !== 'active') throw ApiError.badRequest('Sensor is not active');

  const reading = await db.one(
    `INSERT INTO sensor_readings (sensor_id, household_id, litres_supplied, water_level_percent, recorded_at)
     VALUES ($1,$2,COALESCE($3,0),$4,COALESCE($5, now())) RETURNING *`,
    [sensor.id, sensor.household_id, litres_supplied, water_level_percent ?? null, recorded_at || null]);

  await db.query('UPDATE sensors SET last_seen_at = now() WHERE id = $1', [sensor.id]);

  // Alert Management hook - a low buffer tank raises an alert immediately.
  if (water_level_percent != null && water_level_percent <= env.lowTankThreshold) {
    await alerts.raise({
      sensor_id: sensor.id,
      borehole_id: sensor.borehole_id,
      type: 'low_tank',
      severity: water_level_percent <= 10 ? 'critical' : 'warning',
      message: `Buffer tank at ${water_level_percent}% capacity`,
    });
  }
  return reading;
}

/** Bulk ingest for devices that batch readings while offline. */
async function ingestBatch(items) {
  const results = [];
  for (const item of items) {
    try { results.push({ ok: true, reading: await ingest(item) }); }
    catch (err) { results.push({ ok: false, serial_number: item.serial_number, error: err.message }); }
  }
  return results;
}

async function list({ sensor_id, household_id, borehole_id, from, to, limit, offset }) {
  const where = [];
  const params = [];
  if (sensor_id)    { params.push(sensor_id);    where.push(`r.sensor_id = $${params.length}`); }
  if (household_id) { params.push(household_id); where.push(`r.household_id = $${params.length}`); }
  if (borehole_id)  { params.push(borehole_id);  where.push(`s.borehole_id = $${params.length}`); }
  if (from)         { params.push(from);         where.push(`r.recorded_at >= $${params.length}`); }
  if (to)           { params.push(to);           where.push(`r.recorded_at <= $${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  params.push(limit, offset);
  return db.many(
    `SELECT r.*, s.serial_number, s.type, s.borehole_id
     FROM sensor_readings r JOIN sensors s ON s.id = r.sensor_id
     ${clause} ORDER BY r.recorded_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
}

/** Usage grouped by day / week / month for charts on the dashboards. */
async function usage({ household_id, borehole_id, supplier_id, granularity = 'day', days = 30 }) {
  const bucket = ['day', 'week', 'month'].includes(granularity) ? granularity : 'day';
  const where = [`r.recorded_at >= now() - ($1 || ' days')::interval`];
  const params = [days];
  let join = 'JOIN sensors s ON s.id = r.sensor_id';

  if (household_id) { params.push(household_id); where.push(`r.household_id = $${params.length}`); }
  if (borehole_id)  { params.push(borehole_id);  where.push(`s.borehole_id = $${params.length}`); }
  if (supplier_id) {
    join += ' JOIN boreholes b ON b.id = s.borehole_id';
    params.push(supplier_id); where.push(`b.supplier_id = $${params.length}`);
  }

  return db.many(
    `SELECT date_trunc('${bucket}', r.recorded_at) AS period,
            SUM(r.litres_supplied)::float AS litres,
            AVG(r.water_level_percent)::float AS avg_tank_level
     FROM sensor_readings r ${join}
     WHERE ${where.join(' AND ')}
     GROUP BY period ORDER BY period`, params);
}

/** Sensors that have not reported recently - feeds the sensor_offline alert job. */
const staleSensors = (hours) => db.many(
  `SELECT s.*, b.supplier_id FROM sensors s
   JOIN boreholes b ON b.id = s.borehole_id
   WHERE s.status = 'active'
     AND (s.last_seen_at IS NULL OR s.last_seen_at < now() - ($1 || ' hours')::interval)`, [hours]);

module.exports = { ingest, ingestBatch, list, usage, staleSensors };
