import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import Product from '@/models/Product'
import { buildCartLineId } from '@/lib/cart/identity'
import type {
  CartItem,
  CartItemMeta,
  CartItemPayload,
  CartValidationResponse,
  ValidatedOrder,
} from '@/lib/cart/types'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/constants'
import { invalidateCategoryStatsCache } from '@/lib/categories/category-stats'
import { inventoryChangesFromResults } from '@/lib/audit/inventory-metadata'
import { writeAuditEvent } from '@/lib/audit/write-audit-event'
import { AUDIT_ACTIONS, type InventoryAuditContext } from '@/lib/audit/types'

type VariantDoc = {
  label: string
  price: number
  inStock?: boolean
}

type ProductDoc = {
  _id: mongoose.Types.ObjectId
  name: string
  price: number
  unitLabel?: string
  images?: string[]
  inStock?: boolean
  quantity?: number
  variants?: VariantDoc[]
}

function resolveVariant(
  product: ProductDoc,
  variantId?: string,
  variantLabel?: string,
): VariantDoc | null {
  const variants = product.variants || []
  if (!variants.length) return null

  if (variantId != null) {
    const index = Number.parseInt(variantId, 10)
    if (!Number.isNaN(index) && variants[index]) return variants[index]
  }

  if (variantLabel) {
    const byLabel = variants.find((v) => v.label === variantLabel)
    if (byLabel) return byLabel
  }

  return null
}

function resolveVariantIndex(
  product: ProductDoc,
  variant: VariantDoc | null,
): string | undefined {
  if (!variant || !product.variants?.length) return undefined
  const index = product.variants.findIndex((v) => v.label === variant.label)
  return index >= 0 ? String(index) : undefined
}

function isLineAvailable(product: ProductDoc, variant: VariantDoc | null) {
  const stockQty = typeof product.quantity === 'number' ? product.quantity : 0
  if (!product.inStock || stockQty <= 0) return false
  if (variant && variant.inStock === false) return false
  return true
}

import { getSettings } from '@/lib/settings'
import { getShippingDisplay, roundMoney } from '@/lib/shipping'

export async function validateCartItems(
  payload: CartItemPayload[],
): Promise<CartValidationResponse> {
  await connectToDatabase()

  const items: CartItem[] = []
  const itemsMeta: Record<string, CartItemMeta> = {}
  let removedCount = 0
  let checkoutBlocked = false

  for (const input of payload) {
    const productId = input.productId?.trim()
    const requestedQty = Math.max(1, Math.floor(input.quantity || 1))

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      removedCount += 1
      continue
    }

    const product = (await Product.findById(productId).lean()) as ProductDoc | null
    if (!product) {
      removedCount += 1
      continue
    }

    const hasVariants = (product.variants?.length ?? 0) > 0
    const variant = hasVariants
      ? resolveVariant(product, input.variantId, input.variantLabel)
      : null

    if (hasVariants && !variant) {
      removedCount += 1
      continue
    }

    const serverPrice = roundMoney(variant?.price ?? product.price)
    const lineId = buildCartLineId(productId, variant?.label)
    const meta: CartItemMeta = {}

    const available = isLineAvailable(product, variant)
    const stockQty = Math.max(0, product.quantity ?? 0)

    let quantity = requestedQty
    if (!available) {
      checkoutBlocked = true
      meta.unavailable = true
      meta.message = 'This item is currently unavailable'
    } else if (quantity > stockQty) {
      quantity = stockQty
      meta.quantityAdjusted = true
      meta.message =
        stockQty > 0
          ? `Quantity adjusted to ${stockQty} based on available stock`
          : 'This item is currently unavailable'
      if (stockQty <= 0) {
        checkoutBlocked = true
        meta.unavailable = true
      }
    }

    const clientPrice =
      typeof input.price === 'number' && Number.isFinite(input.price)
        ? roundMoney(input.price)
        : undefined

    if (clientPrice != null && clientPrice !== serverPrice) {
      meta.priceUpdated = true
      meta.message = meta.message || 'Price updated'
    }

    items.push({
      id: lineId,
      productId,
      variantId: resolveVariantIndex(product, variant),
      variantLabel: variant?.label,
      name: product.name,
      price: serverPrice,
      image: product.images?.[0] || PRODUCT_FALLBACK_IMAGE,
      quantity,
      unitLabel: variant?.label || product.unitLabel,
    })

    if (Object.keys(meta).length > 0) {
      itemsMeta[lineId] = meta
      if (meta.unavailable) checkoutBlocked = true
    }
  }

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  const settings = await getSettings()
  const shippingQuote = getShippingDisplay(subtotal, {
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    defaultRate: settings.shipping.defaultRate,
  })

  let globalMessage: string | undefined
  if (removedCount > 0) {
    globalMessage =
      'Some items were removed because they are no longer available.'
  }

  return {
    items,
    subtotal,
    shippingAmount: shippingQuote.shippingAmount,
    freeShippingApplied: shippingQuote.freeShippingApplied,
    shippingThresholdUsed: shippingQuote.shippingThresholdUsed,
    shippingLabel: shippingQuote.shippingLabel,
    total: shippingQuote.orderTotal,
    checkoutBlocked,
    removedCount,
    globalMessage,
    itemsMeta,
  }
}

export async function validateOrderFromClient(
  items: CartItemPayload[],
  clientTotal?: number,
): Promise<ValidatedOrder> {
  const validated = await validateCartItems(items)

  if (validated.removedCount > 0) {
    throw new Error(validated.globalMessage || 'Some cart items are no longer available.')
  }

  if (validated.checkoutBlocked) {
    throw new Error('One or more items in your cart are unavailable.')
  }

  if (!validated.items.length) {
    throw new Error('Cart is empty.')
  }

  const settings = await getSettings()
  const shippingQuote = getShippingDisplay(validated.subtotal, {
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    defaultRate: settings.shipping.defaultRate,
  })

  if (
    clientTotal != null &&
    Math.abs(roundMoney(clientTotal) - shippingQuote.orderTotal) > 0.01
  ) {
    throw new Error('Cart total mismatch. Please refresh your cart and try again.')
  }

  const orderItems = validated.items.map((item) => ({
    product: item.productId,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    variantLabel: item.variantLabel || item.unitLabel,
  }))

  return {
    orderItems,
    subtotal: validated.subtotal,
    shippingAmount: shippingQuote.shippingAmount,
    freeShippingApplied: shippingQuote.freeShippingApplied,
    shippingThresholdUsed: shippingQuote.shippingThresholdUsed,
    total: shippingQuote.orderTotal,
  }
}

export type InventoryAdjustResult = {
  productDoc: InstanceType<typeof Product>
  previousQty: number
  updatedQty: number
}

export async function incrementInventoryForOrderItem(
  productId: string,
  quantity: number,
): Promise<InventoryAdjustResult | null> {
  if (!quantity || quantity <= 0) return null

  const productDoc = await Product.findByIdAndUpdate(
    productId,
    { $inc: { quantity } },
    { new: true },
  )
  if (!productDoc) return null

  const updatedQty =
    typeof productDoc.quantity === 'number' ? productDoc.quantity : 0
  if (productDoc.inStock !== updatedQty > 0) {
    productDoc.inStock = updatedQty > 0
    await productDoc.save()
  }

  return {
    productDoc,
    previousQty: updatedQty - quantity,
    updatedQty,
  }
}

export async function decrementInventoryForOrderItem(
  productId: string,
  quantity: number,
  options?: { throwIfInsufficient?: boolean },
): Promise<InventoryAdjustResult | null> {
  if (!quantity || quantity <= 0) return null

  const productDoc = await Product.findOneAndUpdate(
    {
      _id: productId,
      quantity: { $gte: quantity },
      inStock: true,
    },
    { $inc: { quantity: -quantity } },
    { new: true },
  )

  if (!productDoc) {
    if (options?.throwIfInsufficient) {
      throw new Error('Insufficient stock for one or more items.')
    }
    return null
  }

  const updatedQty =
    typeof productDoc.quantity === 'number' ? productDoc.quantity : 0
  const previousQty = updatedQty + quantity

  if (productDoc.inStock !== updatedQty > 0) {
    productDoc.inStock = updatedQty > 0
    await productDoc.save()
  }

  return { productDoc, previousQty, updatedQty }
}

export async function decrementInventoryForOrderItems(
  items: Array<{ product?: string; quantity?: number }>,
  auditContext?: InventoryAuditContext,
): Promise<InventoryAdjustResult[]> {
  const results: InventoryAdjustResult[] = []

  try {
    for (const item of items) {
      if (!item.product) continue
      const result = await decrementInventoryForOrderItem(
        String(item.product),
        item.quantity || 0,
        { throwIfInsufficient: true },
      )
      if (result) results.push(result)
    }
    await invalidateCategoryStatsCache()

    if (auditContext && results.length > 0) {
      void writeAuditEvent({
        action: AUDIT_ACTIONS.INVENTORY_DECREMENTED,
        orderId: auditContext.orderId,
        metadata: {
          source: auditContext.source,
          inventoryChanges: inventoryChangesFromResults(results),
        },
      })
    }

    return results
  } catch (error) {
    if (results.length > 0) {
      for (const result of results) {
        try {
          const restoredQty = result.previousQty - result.updatedQty
          if (restoredQty > 0) {
            await incrementInventoryForOrderItem(
              result.productDoc._id.toString(),
              restoredQty,
            )
          }
        } catch (rollbackErr) {
          console.error('[inventory] rollback failed', rollbackErr)
        }
      }

      if (auditContext) {
        void writeAuditEvent({
          action: AUDIT_ACTIONS.INVENTORY_ROLLBACK,
          orderId: auditContext.orderId,
          metadata: {
            source: auditContext.source,
            inventoryChanges: inventoryChangesFromResults(results),
          },
        })
      }
    }
    throw error
  }
}
