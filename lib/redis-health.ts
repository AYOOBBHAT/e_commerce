import { getRedisClient } from './redis'

export type RedisRateLimitHealth = {
  configured: boolean
  connected: boolean
  mode: 'redis' | 'fallback'
}

const PING_TIMEOUT_MS = 2_000

export async function getRedisRateLimitHealth(): Promise<RedisRateLimitHealth> {
  const redisUrl = process.env.REDIS_URL
  const redisToken = process.env.REDIS_REST_TOKEN
  const configured = Boolean(redisUrl && redisToken)

  if (!configured) {
    return { configured: false, connected: false, mode: 'fallback' }
  }

  const redis = getRedisClient()
  if (!redis) {
    return { configured: true, connected: false, mode: 'fallback' }
  }

  try {
    const ping = redis.ping()
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis ping timeout')), PING_TIMEOUT_MS)
    })
    await Promise.race([ping, timeout])
    return { configured: true, connected: true, mode: 'redis' }
  } catch {
    return { configured: true, connected: false, mode: 'fallback' }
  }
}
