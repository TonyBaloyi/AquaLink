const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');

const BASE = `
  SELECT b.*, s.name AS supplier_name,
         COUNT(DISTINCT h.id)::int AS household_count
  FROM boreholes b
  JOIN suppliers s ON s.id = b.supplier_id
  LEFT JOIN households h ON h.borehole_id = b.id`;

async function list({ supplier_id, status, limit, offset }) {
  const where = [];
  const params = [];
  if (supplier_id) { params.push(supplier_id); where.push(`b.supplier_id = $${params.length}`); }
  if (status)      { params.push(status);      where.push(`b.status = $${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(`SELECT COUNT(*)::int AS count FROM boreholes b ${clause}`, params);
  params.push(limit, offset);
  const rows = await db.many(
    `${BASE} ${clause} GROUP BY b.id, s.name ORDER BY b.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const borehole = await db.one(`${BASE} WHERE b.id = $1 GROUP BY b.id, s.name`, [id]);
  if (!borehole) throw ApiError.notFound('Borehole not found');
  borehole.sensors = await db.many(
    `SELECT id, type, serial_number, status, last_seen_at FROM sensors WHERE borehole_id = $1`, [id]);
  borehole.tank = await tankLevel(id);
  return borehole;
}

async function create(input, supplierId) {
  const owner = supplierId || input.supplier_id;
  if (!owner) throw ApiError.badRequest('supplier_id is required');
  return db.one(
    `INSERT INTO boreholes (supplier_id, name, location, latitude, longitude,
                            tank_capacity_litres, yield_litres_per_hour, installed_at)
     VALUES ($1,$2,$3,$4,$5,COALESCE($6,500),$7,$8) RETURNING *`,
    [owner, input.name, input.location || null, input.latitude || null, input.longitude || null,
     input.tank_capacity_litres, input.yield_litres_per_hour || null, input.installed_at || null]
  );
}

async function update(id, input) {
  const current = await db.one('SELECT * FROM boreholes WHERE id = $1', [id]);
  if (!current) throw ApiError.notFound('Borehole not found');
  const m = { ...current, ...input };
  return db.one(
    `UPDATE boreholes SET name=$1, location=$2, latitude=$3, longitude=$4,
            tank_capacity_litres=$5, yield_litres_per_hour=$6, status=$7
     WHERE id=$8 RETURNING *`,
    [m.name, m.location, m.latitude, m.longitude, m.tank_capacity_litres,
     m.yield_litres_per_hour, m.status, id]
  );
}

async function remove(id) {
  const res = await db.query('DELETE FROM boreholes WHERE id = $1', [id]);
  if (!res.rowCount) throw ApiError.notFound('Borehole not found');
}

/** Latest buffer-tank level for a borehole (Physical layer item 3). */
async function tankLevel(boreholeId) {
  return db.one(
    `SELECT r.water_level_percent, r.recorded_at,
            b.tank_capacity_litres,
            ROUND(b.tank_capacity_litres * r.water_level_percent / 100.0) AS estimated_litres
     FROM sensor_readings r
     JOIN sensors s ON s.id = r.sensor_id
     JOIN boreholes b ON b.id = s.borehole_id
     WHERE s.borehole_id = $1 AND s.type = 'level' AND r.water_level_percent IS NOT NULL
     ORDER BY r.recorded_at DESC LIMIT 1`, [boreholeId]);
}

/** Sensor registration for a borehole. */
async function addSensor(boreholeId, input) {
  await get(boreholeId);
  return db.one(
    `INSERT INTO sensors (borehole_id, household_id, type, serial_number)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [boreholeId, input.household_id || null, input.type, input.serial_number]
  );
}

/** Ownership guard: a supplier may only touch their own boreholes. */
async function assertOwnership(boreholeId, supplierId) {
  const row = await db.one('SELECT supplier_id FROM boreholes WHERE id = $1', [boreholeId]);
  if (!row) throw ApiError.notFound('Borehole not found');
  if (row.supplier_id !== supplierId) throw ApiError.forbidden('This borehole belongs to another supplier');
}

module.exports = { list, get, create, update, remove, tankLevel, addSensor, assertOwnership };
