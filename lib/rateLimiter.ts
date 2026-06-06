import { Redis } from '@upstash/redis';

type Attempt = { count: number; firstAttempt: number; blockedUntil?: number };

// Basic in-memory store — used as a fallback when Redis not configured
const FAILED_ATTEMPTS = new Map<string, Attempt>();

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000); // 15 minutes default
const MAX_FAILED = Number(process.env.RATE_LIMIT_MAX_FAILED || 5);
const BLOCK_DURATION_MS = Number(process.env.RATE_LIMIT_BLOCK_MS || 15 * 60 * 1000); // 15 minutes default

const USE_REDIS = (process.env.USE_REDIS_RATE_LIMITER === 'true') && !!process.env.REDIS_URL && !!process.env.REDIS_REST_TOKEN;
let redis: Redis | null = null;
let redisInitialized = false;

async function initRedis() {
  if (redisInitialized) return;
  if (!USE_REDIS) {
    redisInitialized = true;
    return;
  }
  const url = process.env.REDIS_URL as string;
  const token = process.env.REDIS_REST_TOKEN as string;
  if (!url || !token) {
    console.warn('[rateLimiter] USE_REDIS_RATE_LIMITER=true but REDIS_URL or REDIS_REST_TOKEN not provided; falling back to memory limiter');
    redisInitialized = true;
    return;
  }
  try {
    redis = new Redis({
      url,
      token,
    });
    // Test connection
    await redis.ping();
    redisInitialized = true;
    console.info('[rateLimiter] connected to Upstash Redis');
  } catch (err) {
    console.error('[rateLimiter] could not connect to Redis, falling back to in-memory limiter', err);
    redis = null;
    redisInitialized = true;
  }
}

// Keys used in Redis
function failKey(k: string) { return `rl:fail:${k}`; }
function blockKey(k: string) { return `rl:block:${k}`; }

export async function recordFailedAttempt(key: string) {
  await initRedis();
  const now = Date.now();

  if (redis) {
    const fk = failKey(key);
    const count = await redis.incr(fk);
    // set TTL on first attempt (convert ms to seconds)
    if (count === 1) await redis.expire(fk, Math.ceil(WINDOW_MS / 1000));
    if (count >= MAX_FAILED) {
      // Use px (milliseconds) for expiration
      await redis.set(blockKey(key), '1', { px: BLOCK_DURATION_MS });
    }
    return;
  }

  const existing = FAILED_ATTEMPTS.get(key);
  if (!existing) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now });
    return;
  }

  if (now - existing.firstAttempt > WINDOW_MS) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now });
    return;
  }

  existing.count += 1;
  if (existing.count >= MAX_FAILED) {
    existing.blockedUntil = now + BLOCK_DURATION_MS;
  }
  FAILED_ATTEMPTS.set(key, existing);
}

// Composite (IP + account) helpers
import crypto from 'crypto';

function hashIdentifier(id: string) {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 12);
}

function comboFailKey(ip: string, identifier: string) { return `rl:combo:fail:${ip}:${hashIdentifier(identifier)}`; }
function comboBlockKey(ip: string, identifier: string) { return `rl:combo:block:${ip}:${hashIdentifier(identifier)}`; }

export async function recordFailedAttemptComposite(ip: string, identifier: string) {
  // record for ip, identifier, and combo
  const ipKey = `login_ip_${ip}`;
  const idKey = `login_email_${identifier}`;
  const comboKey = `combo_${ip}_${hashIdentifier(identifier)}`;

  await recordFailedAttempt(ipKey);
  await recordFailedAttempt(idKey);

  await initRedis();
  const now = Date.now();
  if (redis) {
    const fk = comboFailKey(ip, identifier);
    const count = await redis.incr(fk);
    if (count === 1) await redis.expire(fk, Math.ceil(WINDOW_MS / 1000));
    const comboMax = Number(process.env.RATE_LIMIT_COMBO_MAX_FAILED || MAX_FAILED);
    if (count >= comboMax) {
      await redis.set(comboBlockKey(ip, identifier), '1', { px: BLOCK_DURATION_MS });
    }
    return;
  }

  // fallback in-memory
  const key = `combo__${ip}__${hashIdentifier(identifier)}`;
  const existing = FAILED_ATTEMPTS.get(key);
  if (!existing) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now });
    return;
  }
  if (now - existing.firstAttempt > WINDOW_MS) {
    FAILED_ATTEMPTS.set(key, { count: 1, firstAttempt: now });
    return;
  }
  existing.count += 1;
  const comboMax = Number(process.env.RATE_LIMIT_COMBO_MAX_FAILED || MAX_FAILED);
  if (existing.count >= comboMax) {
    existing.blockedUntil = now + BLOCK_DURATION_MS;
  }
  FAILED_ATTEMPTS.set(key, existing);
}

export async function isBlockedComposite(ip: string, identifier: string) {
  await initRedis();
  const ipKey = `login_ip_${ip}`;
  const idKey = `login_email_${identifier}`;

  if (await isBlocked(ipKey)) return true;
  if (await isBlocked(idKey)) return true;

  if (redis) {
    const b = await redis.get<string>(comboBlockKey(ip, identifier));
    return !!b;
  }

  const key = `combo__${ip}__${hashIdentifier(identifier)}`;
  const existing = FAILED_ATTEMPTS.get(key);
  const now = Date.now();
  if (!existing) return false;
  if (existing.blockedUntil && existing.blockedUntil > now) return true;
  if (existing.blockedUntil && existing.blockedUntil <= now) {
    FAILED_ATTEMPTS.delete(key);
    return false;
  }
  return false;
}

export async function resetAttemptsComposite(ip: string, identifier: string) {
  await initRedis();
  const ipKey = `login_ip_${ip}`;
  const idKey = `login_email_${identifier}`;

  await resetAttempts(ipKey);
  await resetAttempts(idKey);

  if (redis) {
    await redis.del(comboFailKey(ip, identifier));
    await redis.del(comboBlockKey(ip, identifier));
  } else {
    const key = `combo__${ip}__${hashIdentifier(identifier)}`;
    FAILED_ATTEMPTS.delete(key);
  }
}

export async function resetAttempts(key: string) {
  await initRedis();
  if (redis) {
    await redis.del(failKey(key));
    await redis.del(blockKey(key));
    return;
  }
  FAILED_ATTEMPTS.delete(key);
}

export async function isBlocked(key: string) {
  await initRedis();
  if (redis) {
    const b = await redis.get<string>(blockKey(key));
    return !!b;
  }

  const now = Date.now();
  const existing = FAILED_ATTEMPTS.get(key);
  if (!existing) return false;
  if (existing.blockedUntil && existing.blockedUntil > now) return true;
  if (existing.blockedUntil && existing.blockedUntil <= now) {
    FAILED_ATTEMPTS.delete(key);
    return false;
  }
  return false;
}

export async function getAttempts(key: string) {
  await initRedis();
  if (redis) {
    const v = await redis.get<string>(failKey(key));
    return Number(v || 0);
  }
  const existing = FAILED_ATTEMPTS.get(key);
  return existing?.count || 0;
}

// Admin helpers to list and clear keys (works across redis and in-memory fallback)
export async function listRateLimiterKeys({ limit = 100, category, cursor = '0' }: { limit?: number; category?: 'fail'|'block'|'comboFail'|'comboBlock'; cursor?: string } = {}) {
  await initRedis();
  const results: Array<{ key: string; type: 'fail' | 'block' | 'comboFail' | 'comboBlock'; attempts?: number }> = [];

  // Helper to map redis key to result type
  const mapKey = (k: string) => {
    if (k.startsWith('rl:combo:fail:')) return { key: k, type: 'comboFail' as const };
    if (k.startsWith('rl:combo:block:')) return { key: k, type: 'comboBlock' as const };
    if (k.startsWith('rl:fail:')) return { key: k, type: 'fail' as const };
    if (k.startsWith('rl:block:')) return { key: k, type: 'block' as const };
    return { key: k, type: 'fail' as const };
  };

  if (redis) {
    // Upstash REST API doesn't support SCAN efficiently
    // We'll use a pattern-based approach, but note: this is less efficient
    // For production, consider using tag-based keys or maintaining a separate index
    console.warn('[rateLimiter] Pattern-based key listing is limited with REST API. Consider using specific key lookups.');
    
    // Return empty for now - in production, you'd maintain a separate index of keys
    // or use tag-based approach similar to cache invalidation
    return { keys: results, nextCursor: '0' };
  }

  // In-memory fallback: simulate pagination
  const allKeys = Array.from(FAILED_ATTEMPTS.keys()).filter((k) => {
    if (!category) return true;
    if (category === 'comboFail') return k.startsWith('combo__');
    if (category === 'fail') return !k.startsWith('combo__') && !k.includes('blocked');
    if (category === 'block') return FAILED_ATTEMPTS.get(k)?.blockedUntil;
    return true;
  });

  const start = Number(cursor || '0');
  const slice = allKeys.slice(start, start + limit);
  for (const k of slice) {
    const v = FAILED_ATTEMPTS.get(k)!;
    if (k.startsWith('combo__')) {
      results.push({ key: k, type: 'comboFail', attempts: v.count });
    } else if (v.blockedUntil) {
      results.push({ key: k, type: 'block', attempts: v.count });
    } else {
      results.push({ key: k, type: 'fail', attempts: v.count });
    }
  }

  const newCursor = (start + slice.length) >= allKeys.length ? '0' : String(start + slice.length);
  return { keys: results, nextCursor: newCursor };
}

export async function clearRateLimiterKey(k: string) {
  await initRedis();
  if (redis) {
    // If a user provided a full redis key (rl:fail:....) we remove it, plus matching block keys
    await redis.del(k);
    // attempt to derive a fail/block variant
    if (k.startsWith('rl:fail:')) await redis.del(k.replace('rl:fail:', 'rl:block:'));
    if (k.startsWith('rl:block:')) await redis.del(k.replace('rl:block:', 'rl:fail:'));
    // combo variants
    if (k.startsWith('rl:combo:fail:')) await redis.del(k.replace('rl:combo:fail:', 'rl:combo:block:'));
    if (k.startsWith('rl:combo:block:')) await redis.del(k.replace('rl:combo:block:', 'rl:combo:fail:'));
    return true;
  }

  // in-memory fallback
  if (FAILED_ATTEMPTS.has(k)) {
    FAILED_ATTEMPTS.delete(k);
    return true;
  }
  // Accept composite in-memory key format
  if (k.startsWith('combo__')) {
    FAILED_ATTEMPTS.delete(k);
    return true;
  }
  return false;
}
