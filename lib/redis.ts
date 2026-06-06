import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let redisInitialized = false;

// Upstash Redis client - optimized for Vercel/serverless
export function getRedisClient(): Redis | null {
  // Check if Redis credentials are provided
  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    if (redisInitialized) return null;
    redisInitialized = true;
    return null;
  }

  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    redisInitialized = true;
    console.info('[Redis] Connected to Upstash Redis');
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    redisInitialized = true;
    return null;
  }
}

// Cache version for invalidation strategy
const CACHE_VERSION = 'v1';

// Generate versioned cache key
function getVersionedKey(key: string): string {
  return `${CACHE_VERSION}:${key}`;
}

// Cache stampede prevention: lock key for concurrent requests
const LOCK_TTL = 10; // 10 seconds lock
const LOCK_PREFIX = 'lock:';

async function acquireLock(redis: Redis, lockKey: string): Promise<boolean> {
  try {
    const result = await redis.set(lockKey, '1', { ex: LOCK_TTL, nx: true });
    return result === 'OK';
  } catch (error) {
    console.error(`[Redis] Error acquiring lock ${lockKey}:`, error);
    return false;
  }
}

async function releaseLock(redis: Redis, lockKey: string): Promise<void> {
  try {
    await redis.del(lockKey);
  } catch (error) {
    console.error(`[Redis] Error releasing lock ${lockKey}:`, error);
  }
}

// Cache-aside pattern with cache stampede prevention
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number; // Time to live in seconds
    tags?: string[]; // Tags for invalidation
    skipCache?: boolean; // Skip cache (useful for testing)
  }
): Promise<T> {
  const redis = getRedisClient();
  const versionedKey = getVersionedKey(key);
  const lockKey = `${LOCK_PREFIX}${versionedKey}`;

  // Fallback to direct fetch if Redis is not available
  if (!redis || options?.skipCache) {
    return fetcher();
  }

  // Try to get from cache
  try {
    const cached = await redis.get<T>(versionedKey);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    console.error(`[Redis] Error getting key ${key}:`, error);
    // Continue to fetcher on error (fail open)
  }

  // Cache miss - try to acquire lock to prevent cache stampede
  const hasLock = await acquireLock(redis, lockKey);
  
  if (!hasLock) {
    // Another request is fetching, wait a bit and retry cache
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const cached = await redis.get<T>(versionedKey);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      // Continue to fetcher
    }
  }

  // Fetch data
  let data: T;
  try {
    data = await fetcher();
  } catch (fetchError) {
    // Release lock on error
    if (hasLock) {
      await releaseLock(redis, lockKey);
    }
    throw fetchError;
  }

  // Store in cache
  try {
    const ttl = options?.ttl || 3600; // Default 1 hour

    // Store data
    await redis.set(versionedKey, data, { ex: ttl });

    // Store tags for invalidation
    if (options?.tags && options.tags.length > 0) {
      const pipeline = redis.pipeline();
      for (const tag of options.tags) {
        const tagKey = getVersionedKey(`tag:${tag}`);
        pipeline.sadd(tagKey, versionedKey);
        pipeline.expire(tagKey, ttl);
      }
      await pipeline.exec();
    }
  } catch (error) {
    console.error(`[Redis] Error setting key ${key}:`, error);
    // Don't fail the request if cache set fails
  } finally {
    // Always release lock
    if (hasLock) {
      await releaseLock(redis, lockKey);
    }
  }

  return data;
}

// Invalidate cache by tags (with versioned keys)
export async function invalidateByTags(tags: string[]): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keysToDelete: string[] = [];

    for (const tag of tags) {
      const tagKey = getVersionedKey(`tag:${tag}`);
      const keys = await redis.smembers<string[]>(tagKey);
      
      if (keys && keys.length > 0) {
        keysToDelete.push(...keys);
        keysToDelete.push(tagKey);
      }
    }

    // Delete all keys in batch
    if (keysToDelete.length > 0) {
      // Upstash Redis supports batch delete
      const pipeline = redis.pipeline();
      for (let i = 0; i < keysToDelete.length; i += 100) {
        const batch = keysToDelete.slice(i, i + 100);
        pipeline.del(...batch);
      }
      await pipeline.exec();
    }
  } catch (error) {
    console.error(`[Redis] Error invalidating tags ${tags.join(',')}:`, error);
  }
}

// Invalidate cache by pattern (versioned)
export async function invalidatePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const versionedPattern = getVersionedKey(pattern);
    
    // Upstash doesn't support SCAN directly, so we'll use keys (use with caution in production)
    // For production, use tag-based invalidation instead
    console.warn('[Redis] Pattern-based invalidation is not recommended for Upstash. Use tag-based invalidation instead.');
    
    // Alternative: Use tag-based invalidation for specific patterns
    // This is a limitation of REST API - we can't efficiently scan keys
  } catch (error) {
    console.error(`[Redis] Error invalidating pattern ${pattern}:`, error);
  }
}

// Delete specific key (versioned)
export async function deleteKey(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const versionedKey = getVersionedKey(key);
    await redis.del(versionedKey);
  } catch (error) {
    console.error(`[Redis] Error deleting key ${key}:`, error);
  }
}

// Clear all cache (useful for testing or full reset)
export async function clearAllCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Note: Upstash REST API doesn't support FLUSHALL
    // Use tag-based invalidation for specific tags instead
    console.warn('[Redis] Clear all cache not supported via REST API. Use tag-based invalidation.');
  } catch (error) {
    console.error('[Redis] Error clearing all cache:', error);
  }
}

// Get cache statistics (for monitoring)
export async function getCacheStats(): Promise<{
  connected: boolean;
  keysCount?: number;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return { connected: false };
  }

  try {
    // Upstash REST API doesn't support INFO command
    // Return basic connection status
    return {
      connected: true,
    };
  } catch (error) {
    console.error('[Redis] Error getting cache stats:', error);
    return { connected: false };
  }
}
