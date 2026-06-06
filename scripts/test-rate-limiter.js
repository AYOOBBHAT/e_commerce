const fetch = require('node-fetch');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const email = 'nonexistent@example.com';
  for (let i = 1; i <= 8; i++) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrongpass' }),
    });
    const body = await res.json();
    console.log(i, res.status, body);
    await new Promise(r => setTimeout(r, 200));
  }
})();