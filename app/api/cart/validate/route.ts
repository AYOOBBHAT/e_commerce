import { NextRequest, NextResponse } from 'next/server'
import { validateCartItems } from '@/lib/cart/validation.server'
import type { CartItemPayload } from '@/lib/cart/types'
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceApiRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 30,
      keyPrefix: 'cart:validate',
      limitHeader: '30',
    })
    if (limited) return limited

    const body = await request.json()
    const items = Array.isArray(body?.items) ? (body.items as CartItemPayload[]) : []

    const result = await validateCartItems(
      items.map((item) => ({
        productId: String(item.productId || ''),
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price: typeof item.price === 'number' ? item.price : undefined,
      })),
    )

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[cart][validate]', error)
    return NextResponse.json({ error: 'Failed to validate cart' }, { status: 500 })
  }
}
