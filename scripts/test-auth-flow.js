const fetch = require('node-fetch');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';

  // Create a test user
  const email = `test+${Date.now()}@example.com`;
  const password = 'Str0ng!Passw0rd';

  console.log('Registering', email);
  let res = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password }),
  });
  console.log('Register status', res.status);
  console.log(await res.text());

  // Login
  res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('Login status', res.status);
  console.log(await res.text());
})();