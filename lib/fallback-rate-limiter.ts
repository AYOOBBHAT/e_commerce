type AttemptWindow = {
  timestamps: number[]
  lastSeen: number
}

type FallbackRateLimitOptions = {
  maxRequests: number
  windowMs: number
}

type FallbackRateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __fallbackRateLimiter: Map<string, AttemptWindow> | undefined
}

const MAX_FALLBACK_KEYS = 10_000
const SWEEP_INTERVAL_MS = 60_000

const store: Map<string, AttemptWindow> =
  globalThis.__fallbackRateLimiter ?? new Map<string, AttemptWindow>()
globalThis.__fallbackRateLimiter = store

let lastSweepAt = 0

function pruneWindow(entry: AttemptWindow, windowStart: number, now: number): void {
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)
  entry.lastSeen = now
}

function deleteIfEmpty(key: string, entry: AttemptWindow): void {
  if (entry.timestamps.length === 0) {
    store.delete(key)
  }
}

function evictOldestKey(): void {
  let oldestKey: string | null = null
  let oldestSeen = Infinity

  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.lastSeen < oldestSeen) {
      oldestSeen = entry.lastSeen
      oldestKey = key
    }
  }

  if (oldestKey) {
    store.delete(oldestKey)
  }
}

function sweepStaleEntries(now: number, maxWindowMs: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return
  lastSweepAt = now

  const cutoff = now - maxWindowMs
  for (const [key, entry] of Array.from(store.entries())) {
    entry.timestamps = entry.timestamps.filter((ts: number) => ts > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

export function fallbackRateLimit(
  key: string,
  options: FallbackRateLimitOptions,
): FallbackRateLimitResult {
  const { maxRequests, windowMs } = options
  const now = Date.now()
  const windowStart = now - windowMs
  const resetAt = now + windowMs

  sweepStaleEntries(now, windowMs)

  let entry = store.get(key)
  if (!entry) {
    if (store.size >= MAX_FALLBACK_KEYS) {
      evictOldestKey()
    }
    entry = { timestamps: [], lastSeen: now }
    store.set(key, entry)
  }

  pruneWindow(entry, windowStart, now)

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] ?? now
    deleteIfEmpty(key, entry)
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    }
  }

  entry.timestamps.push(now)
  entry.lastSeen = now

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    resetAt,
  }
}
