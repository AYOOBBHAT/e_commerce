import { NextResponse } from 'next/server'
import { rateLimit, getClientIdentifier } from '@/lib/api-rate-limiter'

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
  keyPrefix: string
  userId?: string
  limitHeader?: string
  critical?: boolean
  fallbackMaxRequests?: number
}

export async function enforceApiRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request, options.userId)
  const result = await rateLimit(identifier, {
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
    keyPrefix: options.keyPrefix,
    critical: options.critical,
    fallbackMaxRequests: options.fallbackMaxRequests,
  })

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(
            (result.resetAt - Date.now()) / 1000,
          ).toString(),
          ...(options.limitHeader
            ? { 'X-RateLimit-Limit': options.limitHeader }
            : {}),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
        },
      },
    )
  }

  return null
}
