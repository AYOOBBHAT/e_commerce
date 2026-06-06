# Redis/Upstash Setup Guide

## Setting up Upstash Redis for Vercel

### 1. Create Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click "Create Database"
3. Choose:
   - **Region**: Select closest to your Vercel deployment region
   - **Type**: Redis
   - **TLS**: Enabled (recommended)
4. Copy the **REST URL** and **REST Token**

### 2. Environment Variables

Add to your Vercel project environment variables:

```env
# Upstash Redis REST URL (REQUIRED)
# Get this from Upstash Console → Your Database → REST URL
REDIS_URL=https://global-xxxx.upstash.io

# Upstash Redis Token (REQUIRED)
# Get this from Upstash Console → Your Database → REST Token
REDIS_TOKEN=AXxxxxxx...
```

**Important Notes:**
- **Use REST URL and Token** (not Redis protocol URL)
- Copy both "REST URL" and "REST Token" from Upstash Console
- These are used with `@upstash/redis` package which uses REST API (serverless-safe)

### 3. Vercel Configuration

1. Go to your Vercel project → Settings → Environment Variables
2. Add both `REDIS_URL` and `REDIS_TOKEN`
3. Redeploy your application

**Why REST API?**
- `@upstash/redis` uses REST API instead of persistent TCP connections
- Better for serverless/Vercel (no connection pooling needed)
- Works perfectly with Vercel's edge functions and serverless functions

## Cache Strategy

### Cache Keys Structure

All cache keys are versioned with `v1:` prefix for easy invalidation:

```
v1:products:all:hash
v1:products:id:{id}
v1:products:slug:{slug}
v1:products:category:{category}:hash
v1:products:search:{query}:hash
v1:tag:products
v1:tag:category:{category}
```

### Cache-Aside Pattern

1. **Read**: Check cache → if miss, fetch from DB → store in cache
2. **Write**: Update DB → invalidate related cache
3. **Cache Stampede Prevention**: Uses locks to prevent concurrent fetches

### TTL Strategy

- **Product listings**: 1 hour (3600s)
- **Product details**: 1 hour (3600s)
- **Search results**: 5 minutes (300s) - shorter due to dynamic nature
- **Category listings**: 1 hour (3600s)

### Cache Invalidation

Cache is invalidated when:
- Product is created
- Product is updated
- Product is deleted

Uses **tag-based invalidation** for efficient batch deletion.

## Safety Features

### 1. Cache Stampede Prevention

Uses distributed locks to prevent multiple concurrent fetches of the same data:

```typescript
// If cache miss and lock acquired → fetch data
// If cache miss and lock not acquired → wait and retry cache
```

### 2. Memory Leak Prevention

- Single Redis client instance (singleton pattern)
- Proper connection cleanup
- Error handling that doesn't create new connections

### 3. Graceful Degradation

- Falls back to direct DB queries if Redis unavailable
- Never fails requests due to cache errors
- Logs errors without crashing

### 4. Rate Limiting

Rate limiting uses Redis for distributed rate limiting across serverless instances:

```typescript
// 10 orders per minute per user/IP
// 100 product requests per minute per IP
```

## Testing Redis Connection

Create a test endpoint to verify Redis is working:

```typescript
// app/api/test-redis/route.ts
import { getRedisClient, getCacheStats } from '@/lib/redis';

export async function GET() {
  const stats = await getCacheStats();
  return Response.json(stats);
}
```

## Monitoring

### Upstash Console

1. Go to Upstash Console → Your Database
2. Monitor:
   - **Commands per second**: Should be reasonable (< 1000)
   - **Memory usage**: Monitor for leaks
   - **Hit rate**: Should be high (> 80%)

### Application Logs

Check for:
- `[Redis] Connected` - successful connection
- `[Redis] Error` - connection or operation errors
- `[Redis] Invalid cache data` - corrupted cache entries

## Cost Optimization

### Upstash Free Tier

- 10,000 commands per day
- 256 MB storage
- 100 concurrent connections

### Cost-Saving Tips

1. **Use appropriate TTLs**: Don't cache too long
2. **Batch operations**: Use pipelines for multiple operations
3. **Monitor usage**: Check Upstash console regularly
4. **Cache only hot data**: Don't cache rarely accessed data

## Troubleshooting

### Redis not connecting

1. Check `REDIS_URL` and `REDIS_TOKEN` environment variables
2. Verify Upstash database is active
3. Check Vercel function logs for connection errors
4. Ensure both REST URL and Token are copied correctly from Upstash Console

### Cache not working

1. Check Redis connection status
2. Verify cache keys are being set (use Redis CLI)
3. Check TTL values
4. Verify invalidation logic is correct

### Memory issues

1. Monitor memory usage in Upstash console
2. Reduce TTL values
3. Clear old cache keys periodically
4. Use pattern-based invalidation carefully

## Production Checklist

- [ ] Upstash database created and configured
- [ ] `REDIS_URL` and `REDIS_TOKEN` set in Vercel environment variables
- [ ] Test Redis connection (use `/api/test-redis` endpoint)
- [ ] Monitor cache hit rates
- [ ] Set up Upstash alerts for high usage
- [ ] Review and adjust TTL values
- [ ] Test cache invalidation on product updates
- [ ] Monitor memory usage
- [ ] Set up backup strategy if needed

