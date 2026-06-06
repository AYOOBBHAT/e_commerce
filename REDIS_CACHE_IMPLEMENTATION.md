# Redis Cache Implementation Details

## Architecture

### Cache-Aside Pattern

```
1. Read Request
   ├─ Check Redis cache
   ├─ If HIT → Return cached data
   └─ If MISS → 
      ├─ Acquire lock (prevent stampede)
      ├─ Fetch from database
      ├─ Store in Redis
      └─ Release lock
```

### Cache Keys Structure

All keys are versioned with `v1:` prefix for easy invalidation:

```
v1:products:all:hash           # All products listing
v1:products:id:{id}            # Product by ID
v1:products:slug:{slug}        # Product by slug
v1:products:category:{cat}:hash # Products by category
v1:products:search:{query}:hash # Search results
v1:products:featured:hash      # Featured products
v1:tag:products                # Tag for product invalidation
v1:tag:category:{cat}          # Tag for category invalidation
v1:lock:...                    # Locks for stampede prevention
```

## Safety Features

### 1. Cache Stampede Prevention

**Problem**: Multiple concurrent requests hit cache miss simultaneously → all fetch from DB

**Solution**: Distributed locks using Redis

```typescript
// Pseudo-code
if (cache miss) {
  if (acquire lock) {
    fetch from DB
    store in cache
    release lock
  } else {
    wait 100ms
    retry cache read
  }
}
```

**Lock TTL**: 10 seconds (prevents deadlocks)

### 2. Memory Leak Prevention

- **Singleton pattern**: Single Redis client instance
- **Connection reuse**: Client reused across requests
- **Error handling**: Errors don't create new connections
- **Proper cleanup**: Connections closed on errors

### 3. Graceful Degradation

- **Fail open**: If Redis unavailable, fall back to direct DB queries
- **Error isolation**: Cache errors never fail requests
- **Logging**: All errors logged for debugging

### 4. Versioned Keys

All cache keys prefixed with version (`v1:`) for:
- **Easy invalidation**: Change version to invalidate all cache
- **Key organization**: Clear structure
- **Future migrations**: Easy to migrate cache format

## Cache Invalidation

### Tag-Based Invalidation

When a product is updated:

```typescript
// Invalidate related cache
await invalidateByTags([
  'products',           // All product listings
  'product:slug-123',   // Specific product
  'category:spices',    // Category listings
]);
```

### Pattern-Based Invalidation

For batch operations:

```typescript
// Invalidate all product caches
await invalidatePattern('products:*');
```

### Direct Key Deletion

For specific items:

```typescript
await deleteKey('products:slug:product-123');
```

## TTL Strategy

| Cache Type | TTL | Reason |
|------------|-----|--------|
| Product Listings | 3600s (1h) | Relatively static |
| Product Details | 3600s (1h) | Changes infrequently |
| Search Results | 300s (5m) | More dynamic, shorter TTL |
| Category Listings | 3600s (1h) | Similar to product listings |
| Rate Limits | Window-based | Sliding window |

## Performance Optimizations

### 1. Pipeline Operations

Multiple Redis operations batched:

```typescript
const pipeline = redis.pipeline();
pipeline.setex(key1, ttl, value1);
pipeline.setex(key2, ttl, value2);
pipeline.sadd(tagKey, key1);
await pipeline.exec(); // Single network round-trip
```

### 2. Batch Deletions

Tag invalidation batches deletions:

```typescript
// Instead of: await redis.del(key1); await redis.del(key2); ...
// We do:
pipeline.del(key1, key2, key3, ...); // Up to 100 keys per batch
```

### 3. Lazy Connection

Connections established on first use (serverless-friendly):

```typescript
lazyConnect: true // Don't connect until first operation
```

## Rate Limiting

### Sliding Window Log Algorithm

More accurate than simple counters:

1. Store timestamps of requests in sorted set
2. Remove old timestamps (outside window)
3. Count timestamps within window
4. Compare with limit

**Advantages**:
- Accurate sliding window
- Works across serverless instances
- Prevents burst attacks

**Example**:
```
Window: 60s, Limit: 10 requests
Requests at: [0s, 5s, 10s, ..., 55s, 58s] → 10 requests
At 61s: Remove requests < 1s, Count remaining → 9 requests
```

## Monitoring

### Cache Hit Rate

Monitor in application logs:
- Cache hits vs misses
- Cache operation errors
- Lock acquisition failures

### Upstash Console

Monitor:
- **Commands/sec**: Should be reasonable
- **Memory usage**: Watch for growth
- **Latency**: P50, P95, P99

### Metrics to Track

1. **Cache Hit Rate**: Target > 80%
2. **Average Response Time**: Compare cached vs uncached
3. **Redis Memory Usage**: Should be stable
4. **Error Rate**: Should be < 0.1%

## Best Practices

### Do's ✅

- Use appropriate TTLs based on data freshness needs
- Invalidate cache on data mutations
- Use tags for efficient batch invalidation
- Monitor cache hit rates
- Use pipelines for multiple operations
- Handle cache errors gracefully

### Don'ts ❌

- Don't cache sensitive/user-specific data without encryption
- Don't set infinite TTLs
- Don't invalidate cache on every read
- Don't ignore cache errors
- Don't cache data larger than 512MB (Redis limit)
- Don't use cache for critical real-time data

## Testing

### Unit Tests

Test cache functions in isolation:

```typescript
// Mock Redis client
// Test cache hit/miss
// Test invalidation
// Test stampede prevention
```

### Integration Tests

Test with real Redis (or test container):

```typescript
// Test full cache-aside flow
// Test tag invalidation
// Test rate limiting
```

### Load Tests

- Simulate concurrent cache misses
- Verify stampede prevention works
- Test rate limiting accuracy
- Monitor memory usage

## Troubleshooting

### High Memory Usage

1. Check for unbounded keys (no TTL)
2. Reduce TTL values
3. Use pattern-based invalidation carefully
4. Monitor key count

### Low Hit Rate

1. Check TTL values (might be too short)
2. Verify cache is being set correctly
3. Check for premature invalidation
4. Monitor cache key patterns

### Connection Issues

1. Verify `REDIS_URL` is correct
2. Check Upstash database status
3. Verify TLS settings
4. Check connection limits

### Performance Issues

1. Use pipelines for batch operations
2. Reduce network round-trips
3. Monitor Redis latency
4. Consider connection pooling (if not serverless)

