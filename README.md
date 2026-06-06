# e_commerce

A simple e-commerce starter kit built with Next.js.

## Environment variables (auth & payments)

Add the following environment variables in your `.env` or hosting provider settings:

- JWT_SECRET - secret used to sign session tokens
- COOKIE_DOMAIN - optional cookie domain
- COOKIE_SAME_SITE - 'lax' | 'strict' | 'none' (defaults to 'lax')
- EMAIL_USER, EMAIL_PASS, EMAIL_FROM - for sending verification and notification emails

Google OAuth
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_OAUTH_REDIRECT - e.g. `https://your-site.com/api/auth/google/callback`

Setting up Google OAuth:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth 2.0 Client ID (Application type: Web application)
3. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback` (use ngrok for local testing)
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment

Razorpay
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

Cashfree
- CASHFREE_APP_ID
- CASHFREE_SECRET_KEY

PhonePe
- PHONEPE_CLIENT_ID
- PHONEPE_CLIENT_SECRET

Redis rate limiter (optional for production)
- REDIS_URL - e.g. `redis://:password@hostname:6379`
- USE_REDIS_RATE_LIMITER - set to `true` to enable Redis-backed rate-limiter
- RATE_LIMIT_WINDOW_MS - window in ms for counting failed attempts (defaults to 15m)
- RATE_LIMIT_MAX_FAILED - number of failures before blocking (defaults to 5)
- RATE_LIMIT_BLOCK_MS - block duration in ms when threshold reached (defaults to 15m)
- RATE_LIMIT_COMBO_MAX_FAILED - combined IP+account threshold (defaults to the same value as RATE_LIMIT_MAX_FAILED)

Admin UI
- /admin/rate-limiter - view and clear blocked keys or attempt counters (admin role required)

To enable Redis rate-limiter locally:
1. Install Redis (or use a managed provider) and set `REDIS_URL`.
2. Set `USE_REDIS_RATE_LIMITER=true` in your environment and restart the server.
3. Run the test script locally to simulate failures: `BASE_URL=http://localhost:3000 node scripts/test-rate-limiter.js`

Note: you must add `ioredis` to your dependencies (run `npm i ioredis`).
Note: For production, prefer a managed secret store and ensure HTTPS for webhook endpoints.
