const { pool } = require('../config/db');
const supabaseAuth = require('../services/supabase-auth.service');

async function ensureAuthUser({ email, password, name, phone, role }) {
  const existing = await supabaseAuth.findUserByEmail(email);
  if (existing) return existing;
  return supabaseAuth.createUser({ email, password, name, phone, role, emailConfirm: true });
}

(async () => {
  try {
    const adminAuth = await ensureAuthUser({
      email: 'admin@aqualink.co.za', password: 'Password123',
      name: 'System Administrator', phone: '+27821110000', role: 'admin',
    });
    const supplierAuth = await ensureAuthUser({
      email: 'supplier@aqualink.co.za', password: 'Password123',
      name: 'Nomsa Dlamini', phone: '+27821110001', role: 'supplier',
    });
    const householdAuth = await ensureAuthUser({
      email: 'household@aqualink.co.za', password: 'Password123',
      name: 'Thabo Mokoena', phone: '+27821110002', role: 'household',
    });

    const { rows: [admin] } = await pool.query(
      `INSERT INTO users (id,name,email,phone,role)
       VALUES ($1,'System Administrator','admin@aqualink.co.za','+27821110000','admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [adminAuth.id]);

    const { rows: [supplierUser] } = await pool.query(
      `INSERT INTO users (id,name,email,phone,role)
       VALUES ($1,'Nomsa Dlamini','supplier@aqualink.co.za','+27821110001','supplier')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [supplierAuth.id]);

    const { rows: [householdUser] } = await pool.query(
      `INSERT INTO users (id,name,email,phone,role)
       VALUES ($1,'Thabo Mokoena','household@aqualink.co.za','+27821110002','household')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [householdAuth.id]);

    const { rows: [supplier] } = await pool.query(
      `INSERT INTO suppliers (user_id,name,contact_phone,contact_email,village,region)
       VALUES ($1,'Dlamini Water Services','+27821110001','supplier@aqualink.co.za','Mthatha','Eastern Cape')
       ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [supplierUser.id]);

    const { rows: [borehole] } = await pool.query(
      `INSERT INTO boreholes (supplier_id,name,location,tank_capacity_litres,yield_litres_per_hour,installed_at)
       VALUES ($1,'Borehole BH-01','Zone 3, Mthatha',500,800,CURRENT_DATE - 120)
       ON CONFLICT DO NOTHING RETURNING id`, [supplier.id]);

    const boreholeRow = borehole || (await pool.query(
      `SELECT id FROM boreholes WHERE supplier_id = $1 ORDER BY created_at LIMIT 1`, [supplier.id])).rows[0];

    const { rows: [household] } = await pool.query(
      `INSERT INTO households (user_id,borehole_id,address,village,household_size,meter_number)
       VALUES ($1,$2,'12 Ncambedlana Road','Mthatha',5,'MTR-0001')
       ON CONFLICT (user_id) DO UPDATE SET borehole_id = EXCLUDED.borehole_id RETURNING id`,
      [householdUser.id, boreholeRow.id]);

    const { rows: plans } = await pool.query(
      `INSERT INTO subscription_plans (name,monthly_fee,litres_included,rate_per_extra_litre,description)
       VALUES ('Basic',80,3000,0.05,'Essential supply for a small household'),
              ('Standard',150,8000,0.04,'Everyday supply for a family'),
              ('Family',250,15000,0.03,'Large household or shared yard')
       ON CONFLICT (name) DO UPDATE SET monthly_fee = EXCLUDED.monthly_fee
       RETURNING id, name, monthly_fee`);
    const standard = plans.find(p => p.name === 'Standard') || (await pool.query(
      `SELECT id,name,monthly_fee FROM subscription_plans WHERE name='Standard'`)).rows[0];

    const { rows: [sub] } = await pool.query(
      `INSERT INTO subscriptions (household_id,plan_id,status,monthly_fee)
       VALUES ($1,$2,'active',$3)
       ON CONFLICT DO NOTHING RETURNING id`,
      [household.id, standard.id, standard.monthly_fee]);
    const subRow = sub || (await pool.query(
      `SELECT id FROM subscriptions WHERE household_id=$1 AND status='active' LIMIT 1`, [household.id])).rows[0];

    await pool.query(
      `INSERT INTO payments (household_id,subscription_id,amount,method,reference,status,period_start,period_end,paid_at)
       VALUES ($1,$2,$3,'mobile_money','AQL-SEED001','completed',CURRENT_DATE - 30,CURRENT_DATE,now() - INTERVAL '29 days')
       ON CONFLICT (reference) DO NOTHING`,
      [household.id, subRow.id, standard.monthly_fee]);

    const { rows: [flow] } = await pool.query(
      `INSERT INTO sensors (borehole_id,household_id,type,serial_number)
       VALUES ($1,$2,'flow','FLOW-0001')
       ON CONFLICT (serial_number) DO UPDATE SET household_id = EXCLUDED.household_id
       RETURNING id`, [boreholeRow.id, household.id]);
    const { rows: [level] } = await pool.query(
      `INSERT INTO sensors (borehole_id,type,serial_number)
       VALUES ($1,'level','LVL-0001')
       ON CONFLICT (serial_number) DO UPDATE SET borehole_id = EXCLUDED.borehole_id
       RETURNING id`, [boreholeRow.id]);

    const readingCount = await pool.query('SELECT COUNT(*)::int AS count FROM sensor_readings WHERE sensor_id = $1', [flow.id]);
    if (readingCount.rows[0].count === 0) {
      for (let d = 14; d >= 0; d--) {
        await pool.query(
          `INSERT INTO sensor_readings (sensor_id,household_id,litres_supplied,recorded_at)
           VALUES ($1,$2,$3, now() - ($4 || ' days')::interval)`,
          [flow.id, household.id, 150 + Math.round(Math.random() * 120), d]);
        await pool.query(
          `INSERT INTO sensor_readings (sensor_id,water_level_percent,recorded_at)
           VALUES ($1,$2, now() - ($3 || ' days')::interval)`,
          [level.id, 40 + Math.round(Math.random() * 55), d]);
      }
    }
    await pool.query(`UPDATE sensors SET last_seen_at = now()`);

    await pool.query(
      `INSERT INTO alerts (sensor_id,borehole_id,type,severity,message)
       SELECT $1,$2,'low_tank','warning','Buffer tank at 18% capacity'
       WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE borehole_id=$2 AND type='low_tank' AND status='open')`,
      [level.id, boreholeRow.id]);

    console.log(`[seed] done. Logins (password: Password123)
  admin@aqualink.co.za      (admin)
  supplier@aqualink.co.za   (supplier)
  household@aqualink.co.za  (household)`);
    if (!admin) console.warn('admin insert skipped');
  } catch (err) {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
