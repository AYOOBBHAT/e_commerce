import Order from '@/models/Order'
import { getRedisClient } from '@/lib/redis'
import { connectToDatabase } from '@/lib/db'

const REDIS_KEY_PREFIX = 'idempotency:order:'
const PENDING_VALUE = 'PENDING'
const PENDING_TTL_SEC = 120
const COMPLETED_TTL_SEC = 3600
const PENDING_RETRY_AFTER_SEC = 5

export type IdempotencyClaimResult =
  | { status: 'claimed' }
  | { status: 'existing'; mongoId: string; orderId: string }
  | { status: 'pending'; retryAfterSeconds: number }

function redisKey(idempotencyKey: string): string {
  return `${REDIS_KEY_PREFIX}${idempotencyKey}`
}

function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value)
}

export function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: number; keyPattern?: Record<string, unknown> }
  if (err.code !== 11000) return false
  if (err.keyPattern?.idempotencyKey) return true
  const message = String((error as Error).message || '')
  return message.includes('idempotencyKey')
}

export async function findOrderByIdempotencyKey(idempotencyKey: string) {
  await connectToDatabase()
  return Order.findOne({ idempotencyKey })
}

async function resolveExistingFromMongo(
  idempotencyKey: string,
): Promise<Extract<IdempotencyClaimResult, { status: 'existing' }> | null> {
  const existing = await findOrderByIdempotencyKey(idempotencyKey)
  if (!existing) return null
  return {
    status: 'existing',
    mongoId: existing._id.toString(),
    orderId: existing.orderId || existing._id.toString(),
  }
}

async function resolveExistingFromRedisValue(
  value: string,
  idempotencyKey: string,
): Promise<Extract<IdempotencyClaimResult, { status: 'existing' }> | null> {
  if (value === PENDING_VALUE || value.startsWith(`${PENDING_VALUE}:`)) {
    return null
  }

  if (isMongoObjectId(value)) {
    await connectToDatabase()
    const byId = await Order.findById(value)
    if (byId) {
      return {
        status: 'existing',
        mongoId: byId._id.toString(),
        orderId: byId.orderId || byId._id.toString(),
      }
    }
  }

  return resolveExistingFromMongo(idempotencyKey)
}

export async function claimIdempotencyKey(
  idempotencyKey: string,
): Promise<IdempotencyClaimResult> {
  const redis = getRedisClient()
  const key = redisKey(idempotencyKey)

  if (!redis) {
    console.warn(
      '[Idempotency] Redis unavailable — using Mongo-only dedup (degraded claim)',
    )
    const existing = await resolveExistingFromMongo(idempotencyKey)
    if (existing) return existing
    return { status: 'claimed' }
  }

  try {
    const claimed = await redis.set(key, PENDING_VALUE, {
      nx: true,
      ex: PENDING_TTL_SEC,
    })

    if (claimed === 'OK') {
      return { status: 'claimed' }
    }

    const current = await redis.get<string>(key)
    const currentValue =
      typeof current === 'string' ? current : current != null ? String(current) : null

    if (!currentValue) {
      const retryClaim = await redis.set(key, PENDING_VALUE, {
        nx: true,
        ex: PENDING_TTL_SEC,
      })
      if (retryClaim === 'OK') return { status: 'claimed' }
      return { status: 'pending', retryAfterSeconds: PENDING_RETRY_AFTER_SEC }
    }

    if (
      currentValue === PENDING_VALUE ||
      currentValue.startsWith(`${PENDING_VALUE}:`)
    ) {
      return { status: 'pending', retryAfterSeconds: PENDING_RETRY_AFTER_SEC }
    }

    const existing = await resolveExistingFromRedisValue(
      currentValue,
      idempotencyKey,
    )
    if (existing) return existing

    return { status: 'pending', retryAfterSeconds: PENDING_RETRY_AFTER_SEC }
  } catch (error) {
    console.error('[Idempotency] claim error:', error)
    const existing = await resolveExistingFromMongo(idempotencyKey)
    if (existing) return existing
    return { status: 'claimed' }
  }
}

export async function finalizeIdempotencyKey(
  idempotencyKey: string,
  orderMongoId: string,
): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.set(redisKey(idempotencyKey), orderMongoId, {
      ex: COMPLETED_TTL_SEC,
    })
  } catch (error) {
    console.error('[Idempotency] finalize error:', error)
  }
}

export async function releaseIdempotencyKey(
  idempotencyKey: string,
): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  const key = redisKey(idempotencyKey)

  try {
    const current = await redis.get<string>(key)
    const currentValue =
      typeof current === 'string' ? current : current != null ? String(current) : null

    if (
      !currentValue ||
      currentValue === PENDING_VALUE ||
      currentValue.startsWith(`${PENDING_VALUE}:`)
    ) {
      await redis.del(key)
    }
  } catch (error) {
    console.error('[Idempotency] release error:', error)
  }
}
