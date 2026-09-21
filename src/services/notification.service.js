const db = require('../config/db');
const env = require('../config/env');

/**
 * Notification Service (External Services 3.2).
 * Every message is logged to the notifications table, then dispatched by the
 * configured provider. Swap `deliver` for Twilio / SendGrid / FCM in production.
 */
async function send({ userId, channel = 'sms', subject = null, body }) {
  const notification = await db.one(
    `INSERT INTO notifications (user_id, channel, subject, body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId || null, channel, subject, body]);

  try {
    await deliver({ ...notification });
    return db.one(`UPDATE notifications SET status='sent', sent_at=now() WHERE id=$1 RETURNING *`,
      [notification.id]);
  } catch (err) {
    console.error('[notify] delivery failed', err.message);
    return db.one(`UPDATE notifications SET status='failed' WHERE id=$1 RETURNING *`, [notification.id]);
  }
}

async function deliver(notification) {
  if (env.notifyProvider === 'console') {
    console.log(`[notify:${notification.channel}] -> user ${notification.user_id}: ${notification.body}`);
    return;
  }
  // TODO: plug in Twilio (SMS), SendGrid (email) or FCM (push) here.
  throw new Error(`Notification provider "${env.notifyProvider}" is not configured`);
}

module.exports = { send };
