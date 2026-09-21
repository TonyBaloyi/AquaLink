const cron = require('node-cron');
const env = require('../config/env');
const db = require('../config/db');
const subscriptions = require('../modules/subscriptions/subscriptions.service');
const payments = require('../modules/payments/payments.service');
const readings = require('../modules/readings/readings.service');
const alerts = require('../modules/alerts/alerts.service');

/** Monthly billing run - raises the next invoice for every active subscription. */
async function runBilling() {
  const due = await subscriptions.dueForBilling();
  for (const sub of due) {
    await payments.createInvoice({
      household_id: sub.household_id,
      subscription_id: sub.id,
      amount: sub.monthly_fee,
      period_start: sub.next_billing_date,
      period_end: null,
    });
    await db.query(
      `UPDATE subscriptions SET next_billing_date = next_billing_date + INTERVAL '1 month' WHERE id = $1`,
      [sub.id]);
  }
  if (due.length) console.log(`[jobs] billing: ${due.length} invoice(s) raised`);
}

/** Flags overdue invoices and suspends persistently unpaid subscriptions. */
async function runOverdueCheck() {
  const overdue = await payments.overdue();
  for (const invoice of overdue) {
    await alerts.raise({
      household_id: invoice.household_id,
      type: 'payment_overdue',
      severity: 'warning',
      message: `Invoice of R${invoice.amount} is overdue`,
    });
    if (invoice.subscription_id) {
      await db.query(
        `UPDATE subscriptions SET status='suspended'
         WHERE id=$1 AND status='active' AND next_billing_date < CURRENT_DATE - INTERVAL '14 days'`,
        [invoice.subscription_id]);
    }
  }
}

/** Sensors that stopped reporting, and boreholes with no flow. */
async function runSensorHealthCheck() {
  const stale = await readings.staleSensors(env.noFlowHours);
  for (const sensor of stale) {
    await alerts.raise({
      sensor_id: sensor.id,
      borehole_id: sensor.borehole_id,
      type: sensor.type === 'flow' ? 'no_flow' : 'sensor_offline',
      severity: 'critical',
      message: `Sensor ${sensor.serial_number} has not reported in over ${env.noFlowHours} hours`,
    });
  }
}

/** Background Jobs / Scheduler (Core Services). */
function start() {
  if (!env.enableScheduler) return console.log('[jobs] scheduler disabled');

  cron.schedule('0 2 * * *', () => runBilling().catch(console.error));          // 02:00 daily
  cron.schedule('0 3 * * *', () => runOverdueCheck().catch(console.error));     // 03:00 daily
  cron.schedule('*/30 * * * *', () => runSensorHealthCheck().catch(console.error)); // every 30 min

  console.log('[jobs] scheduler started (billing, overdue check, sensor health)');
}

module.exports = { start, runBilling, runOverdueCheck, runSensorHealthCheck };
