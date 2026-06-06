#!/usr/bin/env node
// Integration script to simulate PhonePe webhook and validate DB update
// Usage: NODE_ENV=test node scripts/test-phonepe-webhook.js

const crypto = require('crypto');

async function run() {
  const BASE_URL = process.env.TEST_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME || 'Showkat';
  const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD || 'showkat193221';

  console.log(`Using BASE_URL=${BASE_URL}`);

  // Helper: fetch (node 18+ has global fetch)
  let fetchFn = global.fetch;
  if (!fetchFn) {
    // dynamic import node-fetch if needed
    const { default: fetchImported } = await import('node-fetch');
    fetchFn = fetchImported;
  }

  try {
    // 1) Create an order via API
    const createOrderRes = await fetchFn(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9999999999',
        address: 'Test Address',
        paymentMethod: 'phonepe',
        items: [{ id: null, name: 'Test product', price: 10, quantity: 1, image: '' }],
        total: 10,
      }),
    });

    const created = await createOrderRes.json();
    if (!createOrderRes.ok) {
      console.error('Failed to create order:', created);
      process.exit(1);
    }

    const orderId = created.id || created._id || created.orderId;
    if (!orderId) {
      console.error('Order created but no id returned:', created);
      process.exit(1);
    }

    console.log('Created order with id=', orderId);

    // 2) Build fake webhook payload
    const txnId = 'TEST_TXN_' + Date.now();
    const callbackBody = {
      event: 'CHECKOUT_ORDER_COMPLETED',
      data: {
        merchantOrderId: String(orderId),
        transactionId: txnId,
        state: 'COMPLETED',
        amount: 1000,
      },
    };

    const bodyString = JSON.stringify(callbackBody);

    // 3) Compute authorization header per fallback: sha256(username:password)
    const expectedHash = crypto.createHash('sha256').update(`${PHONEPE_WEBHOOK_USERNAME}:${PHONEPE_WEBHOOK_PASSWORD}`).digest('hex');

    // 4) Post to webhook
    const webhookRes = await fetchFn(`${BASE_URL}/api/payments/phonepe/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expectedHash}`,
      },
      body: bodyString,
    });

    const webhookRespBody = await webhookRes.json();
    console.log('Webhook response:', webhookRes.status, webhookRespBody);

    // 5) Fetch order and validate
    // Wait a short moment in case DB update is async
    await new Promise((r) => setTimeout(r, 1200));

    const orderRes = await fetchFn(`${BASE_URL}/api/orders/${orderId}`);
    const order = await orderRes.json();

    if (!orderRes.ok) {
      console.error('Failed fetching order:', order);
      process.exit(1);
    }

    console.log('Order after webhook:', JSON.stringify(order, null, 2));

    const status = order?.paymentInfo?.status;
    const tx = order?.paymentInfo?.transactionId;

    if (status === 'completed' || tx === String(txnId) || tx === txnId) {
      console.log('SUCCESS: webhook updated order payment info as expected');
      process.exit(0);
    } else {
      console.error('FAIL: webhook did not update order as expected. status=', status, 'tx=', tx);
      process.exit(2);
    }
  } catch (err) {
    console.error('Error running test:', err);
    process.exit(1);
  }
}

run();
