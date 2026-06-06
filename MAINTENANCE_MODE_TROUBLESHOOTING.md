# Maintenance Mode Troubleshooting Guide

## Problem: Maintenance Mode Not Working

If maintenance mode is enabled but non-admin users can still access the site, check the following:

## Step 1: Check Redis Configuration

**Maintenance mode REQUIRES Redis to work!**

1. Verify environment variables are set:
   ```bash
   # Check if these are set in your .env file or Vercel environment variables
   REDIS_URL=https://your-redis-url.upstash.io
   REDIS_TOKEN=AXxxxxxx...
   ```

2. Test Redis connection:
   - Visit: `/api/test-maintenance`
   - This will show you:
     - Redis configuration status
     - Database value
     - Redis value
     - Whether they match

## Step 2: Common Issues

### Issue 1: Redis Not Configured
**Symptoms:**
- `/api/test-maintenance` shows "Redis not configured"
- Maintenance mode enabled in admin but nothing happens

**Solution:**
1. Set up Upstash Redis:
   - Go to https://console.upstash.com/
   - Create a new Redis database
   - Copy the REST URL and REST Token
   - Add to your `.env` file or Vercel environment variables

2. Redeploy your application

### Issue 2: Redis and Database Out of Sync
**Symptoms:**
- `/api/test-maintenance` shows mismatch between Redis and Database

**Solution:**
1. Go to Admin Settings
2. Toggle maintenance mode OFF, then ON again
3. This will force a re-sync

### Issue 3: Middleware Not Running
**Symptoms:**
- Redis is configured correctly
- Database shows maintenance mode enabled
- But users can still access the site

**Solution:**
1. Check server logs for middleware errors
2. Verify middleware is not being bypassed
3. Clear browser cache and try again

## Step 3: Testing

1. **As Admin:**
   - Enable maintenance mode in Admin Settings
   - Check the response - it should show success
   - Visit `/api/test-maintenance` to verify sync

2. **As Non-Admin (or in incognito):**
   - Try to access any page (except `/maintenance`, `/login`, `/register`)
   - You should be redirected to `/maintenance`
   - API calls should return 503 error

3. **Verify Redis:**
   - Visit `/api/test-maintenance`
   - Should show:
     ```json
     {
       "redis": true,
       "database": true,
       "match": true,
       "status": "MAINTENANCE MODE ENABLED"
     }
     ```

## Step 4: Debug Logs

Check your server logs (Vercel logs or local console) for:
- `[MaintenanceMode] ✅ Maintenance mode is ENABLED (from Redis)`
- `[Middleware] Maintenance mode ENABLED - pathname: /, isAdmin: false`
- `[Middleware] Redirecting non-admin to /maintenance from /`

If you see:
- `[MaintenanceMode] ⚠️ CRITICAL: Redis not configured!` → Redis is missing
- `[MaintenanceMode] Redis not available, using cache: false` → Redis connection failed

## Quick Fix Checklist

- [ ] Redis URL and Token are set in environment variables
- [ ] Application has been redeployed after setting Redis variables
- [ ] `/api/test-maintenance` shows Redis is configured
- [ ] Maintenance mode is enabled in Admin Settings
- [ ] `/api/test-maintenance` shows `redis: true` and `database: true`
- [ ] Tested as non-admin user (incognito mode)
- [ ] Cleared browser cache

## Still Not Working?

1. Check Vercel logs for errors
2. Verify Redis database is active in Upstash console
3. Test Redis connection directly using Upstash console
4. Check if middleware is running (look for middleware logs)

