import crypto from 'crypto'
import { Redis } from '@upstash/redis'

type Attempt = { count: number; firstAttempt: number; blockedUntil?: number }

const FAILED_ATTEMPTS = new Map<string, Attempt>()

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
const MAX_FAILED = Number(process.env.RATE_LIMIT_MAX_FAILED || 5)
const BLOCK_DURATION_MS = Number(process.env.RATE_LIMIT_BLOCK_MS || 15 * 60 * 1000)

const USE_REDIS =
  process.env.USE_REDIS_RATE_LIMITER === 'true' &&
  !!process.env.REDIS_URL &&
  !!process.env.REDIS_REST_TOKEN

const REDIS_INDEX_KEY = 'rl:index'

let redis: Redis | null = null
let redisInitialized = false

async function initRedis() {
  if (redisInitialized) return
  if (!USE_REDIS) {
    redisInitialized = true
    return
  }
  const url = process.env.REDIS_URL as string
  const token = process.env.REDIS_REST_TOKEN as string
  if (!url || !token) {
    console.warn(
      '[rateLimiter] USE_REDIS_RATE_LIMITER=true but REDIS_URL or REDIS_REST_TOKEN not provided; falling back to memory limiter',
    )
    redisInitialized = true
    return
  }
  try {
    redis = new Redis({ url, token })
    await redis.ping()
    redisInitialized = true
    console.info('[rateLimiter] connected to Upstash Redis')
  } catch (err) {
    console.error(
      '[rateLimiter] could not connect to Redis, falling back to in-memory limiter',
      err,
    )
    redis = null
    redisInitialized = true
  }
}

function failKey(k: string) {
  return `rl:fail:${k}`
}

function blockKey(k: string) {
  return `rl:block:${k}`
}

function hashIdentifier(id: string) {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 12)
}

function comboFailKey(ip: string, identifier: string) {
  return `rl:combo:fail:${ip}:${hashIdentifier(identifier)}`
}

function comboBlockKey(ip: string, identifier: string) {
  return `rl:combo:block:${ip}:${hashIdentifier(identifier)}`
}

async function indexRedisKey(redisKey: string) {
  if (!redis) return
  await redis.sadd(REDIS_INDEX_KEY, redisKey)
}

async function unindexRedisKey(redisKey: string) {
  if (!redis) return
  await redis.srem(REDIS_INDEX_KEY, redisKey)
}

function mapRedisKeyType(k: string): 'fail' | 'block' | 'comboFail' | 'comboBlock' {
  if (k.startsWith('rl:combo:fail:')) return 'comboFail'
  if (k.startsWith('rl:combo:block:')) return 'comboBlock'
  if (k.startsWith('rl:block:')) return 'block'
  return 'fail'
}

function matchesCategory(
  type: 'fail' | 'block' | 'comboFail' | 'comboBlock',
  category?: 'fail' | 'block' | 'comboFail' | 'comboBlock',
) {
  if (!category) return true
  return type === category
}

export function scopeIpKey(scope: string, ip: string) {
  return `${scope}_ip_${ip}`
}

export function scopeEmailKey(scope: string, email: string) {
  return `${scope}_email_${email.trim().toLowerCase()}`
}

export async function isBlockedScope(
  scope: string,
  ip: string,
  email?: string,
): Promise<boolean> {
  if (await isBlocked(scopeIpKey(scope, ip))) return true
  if (email && (await isBlocked(scopeEmailKey(scope, email)))) return true
  return false
}

export async function recordScopeAttempt(
  scope: string,
  ip: string,
  email?: string,
): Promise<void> {
  await recordFailedAttempt(scopeIpKey(scope, ip))
  if (email) {
    await recordFailedAttempt(scopeEmailKey(scope, email))
  }
}

export async function recordFailedAttempt(key: string) {
  await initRedis()
  const now = Date.now()

  if (redis) {
    const fk = failKey(key)
    const count = await redis.incr(fk)
    await indexRedisKey(fk)
    if (count === 1) await redis.expire(fk, Math.ceil(WINDOW_MS / 1000))
    if (count >= MAX_FAILED) {
      const bk = blockKey(key)
      await redis.set(bk, '1', { px: BLOCK_DURATION_MS })
      await indexRedisKey(bk)
    }
    return
  }

  const existing = FAILED_ATTEMPTS.get(key)
  if (!existing) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now })
    return
  }

  if (now - existing.firstAttempt > WINDOW_MS) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now })
    return
  }

  existing.count += 1
  if (existing.count >= MAX_FAILED) {
    existing.blockedUntil = now + BLOCK_DURATION_MS
  }
  FAILED_ATTEMPTS.set(key, existing)
}

export async function recordFailedAttemptComposite(ip: string, identifier: string) {
  const ipKey = `login_ip_${ip}`
  const idKey = `login_email_${identifier}`

  await recordFailedAttempt(ipKey)
  await recordFailedAttempt(idKey)

  await initRedis()
  const now = Date.now()
  if (redis) {
    const fk = comboFailKey(ip, identifier)
    const count = await redis.incr(fk)
    await indexRedisKey(fk)
    if (count === 1) await redis.expire(fk, Math.ceil(WINDOW_MS / 1000))
    const comboMax = Number(process.env.RATE_LIMIT_COMBO_MAX_FAILED || MAX_FAILED)
    if (count >= comboMax) {
      const bk = comboBlockKey(ip, identifier)
      await redis.set(bk, '1', { px: BLOCK_DURATION_MS })
      await indexRedisKey(bk)
    }
    return
  }

  const key = `combo__${ip}__${hashIdentifier(identifier)}`
  const existing = FAILED_ATTEMPTS.get(key)
  if (!existing) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now })
    return
  }
  if (now - existing.firstAttempt > WINDOW_MS) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now })
    return
  }
  existing.count += 1
  const comboMax = Number(process.env.RATE_LIMIT_COMBO_MAX_FAILED || MAX_FAILED)
  if (existing.count >= comboMax) {
    existing.blockedUntil = now + BLOCK_DURATION_MS
  }
  FAILED_ATTEMPTS.set(key, existing)
}

export async function isBlockedComposite(ip: string, identifier: string) {
  await initRedis()
  const ipKey = `login_ip_${ip}`
  const idKey = `login_email_${identifier}`

  if (await isBlocked(ipKey)) return true
  if (await isBlocked(idKey)) return true

  if (redis) {
    const b = await redis.get<string>(comboBlockKey(ip, identifier))
    return !!b
  }

  const key = `combo__${ip}__${hashIdentifier(identifier)}`
  const existing = FAILED_ATTEMPTS.get(key)
  const now = Date.now()
  if (!existing) return false
  if (existing.blockedUntil && existing.blockedUntil > now) return true
  if (existing.blockedUntil && existing.blockedUntil <= now) {
    FAILED_ATTEMPTS.delete(key)
    return false
  }
  return false
}

export async function resetAttemptsComposite(ip: string, identifier: string) {
  await initRedis()
  const ipKey = `login_ip_${ip}`
  const idKey = `login_email_${identifier}`

  await resetAttempts(ipKey)
  await resetAttempts(idKey)

  if (redis) {
    const cf = comboFailKey(ip, identifier)
    const cb = comboBlockKey(ip, identifier)
    await redis.del(cf)
    await redis.del(cb)
    await unindexRedisKey(cf)
    await unindexRedisKey(cb)
  } else {
    const key = `combo__${ip}__${hashIdentifier(identifier)}`
    FAILED_ATTEMPTS.delete(key)
  }
}

export async function resetAttempts(key: string) {
  await initRedis()
  if (redis) {
    const fk = failKey(key)
    const bk = blockKey(key)
    await redis.del(fk)
    await redis.del(bk)
    await unindexRedisKey(fk)
    await unindexRedisKey(bk)
    return
  }
  FAILED_ATTEMPTS.delete(key)
}

export async function isBlocked(key: string) {
  await initRedis()
  if (redis) {
    const b = await redis.get<string>(blockKey(key))
    return !!b
  }

  const now = Date.now()
  const existing = FAILED_ATTEMPTS.get(key)
  if (!existing) return false
  if (existing.blockedUntil && existing.blockedUntil > now) return true
  if (existing.blockedUntil && existing.blockedUntil <= now) {
    FAILED_ATTEMPTS.delete(key)
    return false
  }
  return false
}

export async function getAttempts(key: string) {
  await initRedis()
  if (redis) {
    const v = await redis.get<string>(failKey(key))
    return Number(v || 0)
  }
  const existing = FAILED_ATTEMPTS.get(key)
  return existing?.count || 0
}

export async function listRateLimiterKeys({
  limit = 100,
  category,
  cursor = '0',
}: {
  limit?: number
  category?: 'fail' | 'block' | 'comboFail' | 'comboBlock'
  cursor?: string
} = {}) {
  await initRedis()
  const results: Array<{
    key: string
    type: 'fail' | 'block' | 'comboFail' | 'comboBlock'
    attempts?: number
  }> = []

  if (redis) {
    const indexed = (await redis.smembers<string[]>(REDIS_INDEX_KEY)) || []
    const activeKeys: string[] = []

    for (const k of indexed) {
      const exists = await redis.exists(k)
      if (!exists) {
        await unindexRedisKey(k)
        continue
      }
      const type = mapRedisKeyType(k)
      if (!matchesCategory(type, category)) continue
      activeKeys.push(k)
    }

    activeKeys.sort()
    const start = Number(cursor || '0')
    const slice = activeKeys.slice(start, start + limit)

    for (const k of slice) {
      const type = mapRedisKeyType(k)
      let attempts: number | undefined
      if (type === 'fail' || type === 'comboFail') {
        const v = await redis.get<string>(k)
        attempts = Number(v || 0)
      }
      results.push({ key: k, type, attempts })
    }

    const newCursor =
      start + slice.length >= activeKeys.length ? '0' : String(start + slice.length)
    return { keys: results, nextCursor: newCursor }
  }

  const allKeys = Array.from(FAILED_ATTEMPTS.keys()).filter((k) => {
    if (!category) return true
    if (category === 'comboFail') return k.startsWith('combo__')
    if (category === 'fail') return !k.startsWith('combo__') && !FAILED_ATTEMPTS.get(k)?.blockedUntil
    if (category === 'block') return FAILED_ATTEMPTS.get(k)?.blockedUntil
    if (category === 'comboBlock') return false
    return true
  })

  const start = Number(cursor || '0')
  const slice = allKeys.slice(start, start + limit)
  for (const k of slice) {
    const v = FAILED_ATTEMPTS.get(k)!
    if (k.startsWith('combo__')) {
      results.push({ key: k, type: 'comboFail', attempts: v.count })
    } else if (v.blockedUntil) {
      results.push({ key: k, type: 'block', attempts: v.count })
    } else {
      results.push({ key: k, type: 'fail', attempts: v.count })
    }
  }

  const newCursor =
    start + slice.length >= allKeys.length ? '0' : String(start + slice.length)
  return { keys: results, nextCursor: newCursor }
}

export async function clearRateLimiterKey(k: string) {
  await initRedis()
  if (redis) {
    const keysToDelete = new Set<string>([k])

    if (k.startsWith('rl:fail:')) keysToDelete.add(k.replace('rl:fail:', 'rl:block:'))
    if (k.startsWith('rl:block:')) keysToDelete.add(k.replace('rl:block:', 'rl:fail:'))
    if (k.startsWith('rl:combo:fail:')) {
      keysToDelete.add(k.replace('rl:combo:fail:', 'rl:combo:block:'))
    }
    if (k.startsWith('rl:combo:block:')) {
      keysToDelete.add(k.replace('rl:combo:block:', 'rl:combo:fail:'))
    }

    for (const key of Array.from(keysToDelete)) {
      await redis.del(key)
      await unindexRedisKey(key)
    }
    return true
  }

  if (FAILED_ATTEMPTS.has(k)) {
    FAILED_ATTEMPTS.delete(k)
    return true
  }
  if (k.startsWith('combo__')) {
    FAILED_ATTEMPTS.delete(k)
    return true
  }
  return false
}
