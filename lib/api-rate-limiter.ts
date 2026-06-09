import { getRedisClient } from './redis'
import { getClientIp } from './client-ip'
import { fallbackRateLimit } from './fallback-rate-limiter'

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
  critical?: boolean
  fallbackMaxRequests?: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

let fallbackDegradationLogged = false

function logFallbackOnce(): void {
  if (!fallbackDegradationLogged) {
    console.warn('[RateLimit] Redis unavailable\nUsing local fallback limiter')
    fallbackDegradationLogged = true
  }
}

function markRedisHealthy(): void {
  fallbackDegradationLogged = false
}

function failOpen(maxRequests: number, resetAt: number): RateLimitResult {
  return { allowed: true, remaining: maxRequests, resetAt }
}

function useFallbackLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  logFallbackOnce()
  const fallbackMax = options.fallbackMaxRequests ?? options.maxRequests
  return fallbackRateLimit(key, {
    maxRequests: fallbackMax,
    windowMs: options.windowMs,
  })
}

// Rate limiter using Redis (Upstash REST API)
// Uses sliding window log algorithm for accuracy
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const { windowMs, maxRequests, keyPrefix = 'ratelimit', critical = false } = options
  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()
  const resetAt = now + windowMs

  if (!redis) {
    if (critical) {
      return useFallbackLimit(key, options)
    }
    console.warn('[RateLimit] Redis not available, allowing request')
    return failOpen(maxRequests, resetAt)
  }

  try {
    const windowStart = now - windowMs
    const windowKey = `${key}:window`

    await redis.zremrangebyscore(windowKey, 0, windowStart)

    const currentCount = (await redis.zcard(windowKey)) || 0

    if (currentCount >= maxRequests) {
      const oldestResults = await redis.zrange<string[]>(windowKey, 0, 0)
      const oldestTimestamp =
        oldestResults && oldestResults.length > 0
          ? parseInt(oldestResults[0].split('-')[0], 10)
          : now

      markRedisHealthy()
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestTimestamp + windowMs,
      }
    }

    const pipeline = redis.pipeline()
    pipeline.zadd(windowKey, { score: now, member: `${now}-${Math.random()}` })
    pipeline.expire(windowKey, Math.ceil(windowMs / 1000) + 1)
    await pipeline.exec()

    markRedisHealthy()
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetAt,
    }
  } catch (error) {
    console.error('[RateLimit] Error:', error)
    if (critical) {
      return useFallbackLimit(key, options)
    }
    return failOpen(maxRequests, resetAt)
  }
}

export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  const ip = getClientIp(request)

  return `ip:${ip}`
}
