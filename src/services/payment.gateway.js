const crypto = require('crypto');
const env = require('../config/env');

/**
 * Payment Gateway adapter (External Services 3.2).
 * The mock provider lets the whole payment flow be demonstrated without
 * live credentials; swap in PayFast / Yoco / mobile money in production.
 */
async function createCheckout({ reference, amount, email, description }) {
  if (env.paymentProvider === 'mock' || !process.env.PAYFAST_MERCHANT_ID) {
    return {
      provider: 'mock',
      reference,
      amount,
      checkout_url: `https://sandbox.payfast.co.za/eng/process?m_payment_id=${reference}&amount=${amount}`,
      instructions: 'Sandbox checkout - POST to /payments/webhook to settle this invoice.',
    };
  }

  // PayFast style redirect payload
  const fields = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    amount: Number(amount).toFixed(2),
    item_name: description,
    email_address: email,
    m_payment_id: reference,
  };
  return {
    provider: 'payfast',
    reference,
    amount,
    checkout_url: 'https://www.payfast.co.za/eng/process',
    fields,
    signature: sign(fields),
  };
}

function sign(fields) {
  const query = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim()).replace(/%20/g, '+')}`)
    .join('&');
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const payload = passphrase ? `${query}&passphrase=${encodeURIComponent(passphrase)}` : query;
  return crypto.createHash('md5').update(payload).digest('hex');
}

/** Normalises a provider webhook into { reference, status }. */
function verifyWebhook(body) {
  const reference = body.m_payment_id || body.reference;
  const raw = (body.payment_status || body.status || '').toLowerCase();
  const status =
    ['complete', 'completed', 'success', 'paid'].includes(raw) ? 'completed' :
    ['failed', 'cancelled'].includes(raw) ? 'failed' : 'pending';
  return { reference, status };
}

module.exports = { createCheckout, verifyWebhook, sign };
