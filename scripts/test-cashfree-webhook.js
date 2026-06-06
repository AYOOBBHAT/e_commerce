const fetch = require('node-fetch');
const crypto = require('crypto');

(async () => {
  const secret = process.env.CASHFREE_SECRET_KEY || 'test_secret';
  const body = {
    order_id: process.env.TEST_CASHFREE_ORDER_ID || `order_${Date.now()}`,
    payment_id: `pay_${Date.now()}`,
    order_status: 'PAID',
  };

  const bodyText = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');

  const res = await fetch((process.env.BASE_URL || 'http://localhost:3000') + '/api/payments/cashfree/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
    body: bodyText,
  });

  const data = await res.json();
  console.log('response', data);
})();