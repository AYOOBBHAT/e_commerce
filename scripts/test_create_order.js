(async ()=>{
  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9999999999',
        address: '123 Test St',
        paymentMethod: 'phonepe',
        items: [{ name: 'Test Product', price: 100, quantity: 1 }],
        total: 100,
      }),
    });
    console.log('STATUS', res.status);
    const text = await res.text();
    console.log('BODY', text);
  } catch (e) {
    console.error('ERR', e);
  }
})();