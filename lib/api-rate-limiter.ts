import { getRedisClient } from './redis';

// Rate limiter using Redis (Upstash REST API)
// Uses sliding window log algorithm for accuracy
export async function rateLimit(
  identifier: string,
  options: {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
    keyPrefix?: string;
  }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisClient();
  const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = options;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const resetAt = now + windowMs;

  if (!redis) {
    // Fallback: allow request if Redis not available (fail open)
    // In production, Redis should always be available
    console.warn('[RateLimit] Redis not available, allowing request');
    return { allowed: true, remaining: maxRequests, resetAt };
  }

  try {
    // Use sliding window log: store timestamps and count within window
    const windowStart = now - windowMs;
    const windowKey = `${key}:window`;
    
    // Remove old timestamps (before windowStart)
    await redis.zremrangebyscore(windowKey, 0, windowStart);
    
    // Count current requests in window
    const currentCount = (await redis.zcard(windowKey)) || 0;
    
    if (currentCount >= maxRequests) {
      // Rate limit exceeded - get oldest timestamp for reset time
      const oldestResults = await redis.zrange<string[]>(windowKey, 0, 0);
      const oldestTimestamp = oldestResults && oldestResults.length > 0 
        ? parseInt(oldestResults[0].split('-')[0], 10) 
        : now;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestTimestamp + windowMs,
      };
    }
    
    // Add current request timestamp and set expiry
    const pipeline = redis.pipeline();
    pipeline.zadd(windowKey, { score: now, member: `${now}-${Math.random()}` });
    pipeline.expire(windowKey, Math.ceil(windowMs / 1000) + 1);
    await pipeline.exec();

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetAt,
    };
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // Fail open - allow request on error (don't block users)
    return { allowed: true, remaining: maxRequests, resetAt };
  }
}

// Get client identifier from request (IP or user ID)
export function getClientIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}
