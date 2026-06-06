# Environment Variables Guide

## Required Environment Variables

### Redis/Upstash (for caching and rate limiting)

**Only add this one:**

```env
# Upstash Redis REST URL
REDIS_URL=https://global-xxxx.upstash.io

# Upstash Redis Token
REDIS_TOKEN=AXxxxxxx...
```

**How to get it:**
1. Create database at [Upstash Console](https://console.upstash.com/)
2. Go to your database → Copy **"REST URL"** and **"REST Token"**
3. Format: REST URL starts with `https://`, Token is a long string starting with `AX...`

**Note:**
- These are the REST API credentials (not Redis protocol URL)
- `@upstash/redis` package uses REST API which is better for serverless/Vercel

### Database

```env
MONGODB_URI=mongodb://localhost:27017/yourdb
# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Authentication

```env
JWT_SECRET=your-secret-key-here
COOKIE_DOMAIN=yourdomain.com  # Optional
COOKIE_SAME_SITE=lax  # 'lax' | 'strict' | 'none'
```

### Email (for notifications)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourstore.com
```

### Google OAuth (optional)

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT=https://zescohnuts.com/api/auth/google/callback
```

### Payment Gateways

**Razorpay:**
```env
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

**Cashfree:**
```env
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET_KEY=your-secret-key
```

**PhonePe:**
```env
PHONEPE_CLIENT_ID=your-client-id
PHONEPE_CLIENT_SECRET=your-client-secret
```

### Site Configuration

```env
NEXT_PUBLIC_BASE_URL=https://yourstore.com
NEXT_PUBLIC_SITE_NAME=Your Store Name
NEXT_PUBLIC_CONTACT_EMAIL=support@yourstore.com
```

### Rate Limiting (Optional - uses Redis)

```env
USE_REDIS_RATE_LIMITER=true  # Enable Redis-backed rate limiter
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes (default)
RATE_LIMIT_MAX_FAILED=5  # Max failed attempts (default)
RATE_LIMIT_BLOCK_MS=900000  # Block duration (default)
RATE_LIMIT_COMBO_MAX_FAILED=5  # Combined IP+account threshold (default)
```

## Quick Setup Checklist

### Minimum Required (Basic Functionality)
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `REDIS_URL` (for caching)

### For Production
- [ ] `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- [ ] Payment gateway credentials (at least one)
- [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] `NEXT_PUBLIC_SITE_NAME`
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL`

### Optional Features
- [ ] Google OAuth credentials
- [ ] Rate limiting configuration
- [ ] `COOKIE_DOMAIN`, `COOKIE_SAME_SITE`

## Notes

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit `.env` file to git (it's in `.gitignore`)
- For Vercel: Add all variables in Project Settings → Environment Variables
- Test Redis connection: Visit `/api/test-redis` after deployment

