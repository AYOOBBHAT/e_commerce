import type { CartItem, CartItemPayload } from '@/lib/cart/types'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/constants'

const OBJECT_ID_LEN = 24
const OBJECT_ID_RE = /^[a-f\d]{24}$/i

function isObjectId(value: string) {
  return OBJECT_ID_RE.test(value)
}

export function buildCartLineId(productId: string, variantLabel?: string): string {
  if (!variantLabel) return productId
  return `${productId}::${encodeURIComponent(variantLabel)}`
}

export function extractProductIdFromLegacyId(id: string): {
  productId: string
  variantLabel?: string
} {
  if (!id) return { productId: '' }

  if (id.includes('::')) {
    const [productId, encoded] = id.split('::', 2)
    return {
      productId,
      variantLabel: encoded ? decodeURIComponent(encoded) : undefined,
    }
  }

  if (isObjectId(id) && id.length === OBJECT_ID_LEN) {
    return { productId: id }
  }

  if (id.length > OBJECT_ID_LEN && isObjectId(id.slice(0, OBJECT_ID_LEN))) {
    return {
      productId: id.slice(0, OBJECT_ID_LEN),
      variantLabel: id.slice(OBJECT_ID_LEN + 1) || undefined,
    }
  }

  return { productId: id }
}

export function createCartItem(input: {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  unitLabel?: string
  variantLabel?: string
  variants?: Array<{ label: string }>
}): CartItem {
  let variantId: string | undefined
  if (input.variantLabel && input.variants?.length) {
    const index = input.variants.findIndex((v) => v.label === input.variantLabel)
    if (index >= 0) variantId = String(index)
  }

  return {
    id: buildCartLineId(input.productId, input.variantLabel),
    productId: input.productId,
    variantId,
    variantLabel: input.variantLabel,
    name: input.name,
    price: input.price,
    image: input.image || PRODUCT_FALLBACK_IMAGE,
    quantity: Math.max(1, input.quantity),
    unitLabel: input.unitLabel,
  }
}

export function normalizeStoredCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null

  const record = raw as Record<string, unknown>
  const legacyId = typeof record.id === 'string' ? record.id : ''
  const legacy = extractProductIdFromLegacyId(legacyId)

  const productId =
    typeof record.productId === 'string' && record.productId
      ? record.productId
      : legacy.productId

  if (!productId) return null

  const variantLabel =
    typeof record.variantLabel === 'string'
      ? record.variantLabel
      : legacy.variantLabel

  const name = typeof record.name === 'string' ? record.name : ''
  const price = typeof record.price === 'number' ? record.price : Number(record.price)
  const quantity =
    typeof record.quantity === 'number' ? record.quantity : Number(record.quantity)
  const image =
    typeof record.image === 'string' && record.image
      ? record.image
      : PRODUCT_FALLBACK_IMAGE

  if (!name || !Number.isFinite(price) || !Number.isFinite(quantity) || quantity < 1) {
    return null
  }

  const variantId =
    typeof record.variantId === 'string' ? record.variantId : undefined

  return {
    id: buildCartLineId(productId, variantLabel),
    productId,
    variantId,
    variantLabel,
    name,
    price,
    image,
    quantity: Math.max(1, Math.floor(quantity)),
    unitLabel: typeof record.unitLabel === 'string' ? record.unitLabel : undefined,
  }
}

export function parseCartStorage(raw: string | null): CartItem[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => normalizeStoredCartItem(entry))
      .filter((item): item is CartItem => item !== null)
  } catch {
    return []
  }
}

export function normalizeOrderItemPayload(raw: unknown): CartItemPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>

  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))

  if (typeof item.productId === 'string' && item.productId) {
    return {
      productId: item.productId,
      variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
      variantLabel:
        typeof item.variantLabel === 'string' ? item.variantLabel : undefined,
      quantity,
    }
  }

  const legacyId = typeof item.id === 'string' ? item.id : ''
  const legacy = extractProductIdFromLegacyId(legacyId)
  if (!legacy.productId) return null

  return {
    productId: legacy.productId,
    variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
    variantLabel:
      typeof item.variantLabel === 'string'
        ? item.variantLabel
        : legacy.variantLabel,
    quantity,
  }
}

export function toValidationPayload(items: CartItem[]): CartItemPayload[] {
  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    price: item.price,
  }))
}
