const fetch = require('node-fetch');
const crypto = require('crypto');

(async () => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'test_secret';
  const body = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_${Date.now()}`,
          order_id: process.env.TEST_RAZORPAY_ORDER_ID || `order_${Date.now()}`,
          amount: 10000
        }
      }
    }
  };

  const bodyText = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', webhookSecret).update(bodyText).digest('hex');

  const res = await fetch((process.env.BASE_URL || 'http://localhost:3000') + '/api/payments/razorpay/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body: bodyText,
  });

  const data = await res.json();
  console.log('response', data);
})();