(async ()=>{
  try{
    const BASE = process.env.BASE_URL || 'http://localhost:3000';
    console.log('Using base', BASE);
    const createRes = await fetch(`${BASE}/api/payments/razorpay/order`, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({amount: 100, currency: 'INR', receipt: `test_rcpt_${Date.now()}`})});
    const createData = await createRes.json();
    console.log('create order response', createRes.status, createData);
    if (!createData?.id && !createData?.order_id) {
      console.error('No order id returned, aborting');
      process.exit(1);
    }
    const orderId = createData.id || createData.order_id || createData.orderId;
    // Generate fake payment id
    const paymentId = `pay_test_${Date.now()}`;
    // Generate signature if secret present
    const secret = process.env.RAZORPAY_KEY_SECRET;
    let signature = null;
    if (secret) {
      const crypto = require('crypto');
      signature = crypto.createHmac('sha256', String(secret)).update(`${orderId}|${paymentId}`).digest('hex');
    } else {
      signature = 'fake-signature';
    }

    // Create order in our system via POST /api/orders with razorpay fields
    const orderPayload = {
      name: 'Rzp Test',
      email: 'rzp@test.local',
      phone: '9999999999',
      address: '123 Test St',
      paymentMethod: 'razorpay',
      items: [{name: 'Test Product', price: 100, quantity: 1}],
      total: 100,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature,
    };

    const res = await fetch(`${BASE}/api/orders`, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(orderPayload)});
    const data = await res.json();
    console.log('create order with razorpay callback response', res.status, data);
  }catch(e){
    console.error('ERR', e);
    process.exit(1);
  }
})();