const db = require('../../config/db');

/** Administrator dashboard headline numbers (Presentation layer 1.3). */
async function overview() {
  const counts = await db.one(`
    SELECT
      (SELECT COUNT(*)::int FROM households WHERE status='active')          AS active_households,
      (SELECT COUNT(*)::int FROM suppliers  WHERE status='active')          AS active_suppliers,
      (SELECT COUNT(*)::int FROM boreholes  WHERE status='active')          AS active_boreholes,
      (SELECT COUNT(*)::int FROM subscriptions WHERE status='active')       AS active_subscriptions,
      (SELECT COUNT(*)::int FROM alerts WHERE status='open')                AS open_alerts,
      (SELECT COUNT(*)::int FROM sensors WHERE status='active')             AS active_sensors`);

  const water = await db.one(`
    SELECT
      COALESCE(SUM(litres_supplied) FILTER (WHERE recorded_at >= date_trunc('day', now())),0)::float   AS litres_today,
      COALESCE(SUM(litres_supplied) FILTER (WHERE recorded_at >= date_trunc('month', now())),0)::float AS litres_this_month
    FROM sensor_readings`);

  const revenue = await db.one(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status='completed' AND paid_at >= date_trunc('month', now())),0)::float AS collected_this_month,
      COALESCE(SUM(amount) FILTER (WHERE status='pending'),0)::float AS outstanding
    FROM payments`);

  return { ...counts, ...water, ...revenue };
}

/** Usage report: litres per village / borehole over a period. */
const usageReport = ({ from, to }) => db.many(`
  SELECT b.id AS borehole_id, b.name AS borehole_name, s.name AS supplier_name,
         COUNT(DISTINCT h.id)::int AS households,
         COALESCE(SUM(r.litres_supplied),0)::float AS litres_supplied
  FROM boreholes b
  JOIN suppliers s ON s.id = b.supplier_id
  LEFT JOIN households h ON h.borehole_id = b.id
  LEFT JOIN sensors sn ON sn.borehole_id = b.id
  LEFT JOIN sensor_readings r ON r.sensor_id = sn.id
       AND r.recorded_at BETWEEN COALESCE($1::timestamptz, now() - INTERVAL '30 days')
                             AND COALESCE($2::timestamptz, now())
  GROUP BY b.id, b.name, s.name
  ORDER BY litres_supplied DESC`, [from || null, to || null]);

/** Payment report: collected vs outstanding per month. */
const revenueReport = ({ months = 12 }) => db.many(`
  SELECT date_trunc('month', COALESCE(paid_at, created_at)) AS period,
         COALESCE(SUM(amount) FILTER (WHERE status='completed'),0)::float AS collected,
         COALESCE(SUM(amount) FILTER (WHERE status='pending'),0)::float   AS outstanding,
         COALESCE(SUM(amount) FILTER (WHERE status='failed'),0)::float    AS failed
  FROM payments
  WHERE COALESCE(paid_at, created_at) >= now() - ($1 || ' months')::interval
  GROUP BY period ORDER BY period`, [months]);

/** Operational report: alert volumes by type and severity. */
const alertReport = ({ days = 30 }) => db.many(`
  SELECT type, severity, COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status='resolved')::int AS resolved,
         ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 2) AS avg_hours_to_resolve
  FROM alerts
  WHERE created_at >= now() - ($1 || ' days')::interval
  GROUP BY type, severity ORDER BY total DESC`, [days]);

/** Top consuming households - used to spot leaks and over-use. */
const topConsumers = ({ limit = 10, days = 30 }) => db.many(`
  SELECT h.id, h.address, h.meter_number, h.household_size,
         COALESCE(SUM(r.litres_supplied),0)::float AS litres,
         ROUND((COALESCE(SUM(r.litres_supplied),0) / NULLIF(h.household_size,0))::numeric, 2) AS litres_per_person
  FROM households h
  LEFT JOIN sensor_readings r ON r.household_id = h.id
       AND r.recorded_at >= now() - ($2 || ' days')::interval
  GROUP BY h.id ORDER BY litres DESC LIMIT $1`, [limit, days]);

module.exports = { overview, usageReport, revenueReport, alertReport, topConsumers };
