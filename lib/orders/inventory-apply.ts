import { connectToDatabase } from '@/lib/db'
import Order from '@/models/Order'
import {
  decrementInventoryForOrderItems,
  incrementInventoryForOrderItem,
  type InventoryAdjustResult,
} from '@/lib/cart/validation.server'

import type { OrderInventorySnapshot } from '@/lib/orders/inventory-consistency'

const FINALIZE_LOCK_STALE_MS = 5 * 60 * 1000
const FINALIZE_LOCK_RETRY_MS = 250
const FINALIZE_LOCK_MAX_ATTEMPTS = 8

export type OrderInventoryLine = {
  product: string
  quantity: number
}

export type InventoryFinalizeClaim =
  | { claimed: true; order: Awaited<ReturnType<typeof Order.findById>> }
  | { claimed: false; reason: 'not_found' }
  | { claimed: false; reason: 'already_finalized'; order: unknown }
  | { claimed: false; reason: 'inventory_failed'; order: unknown }
  | { claimed: false; reason: 'in_progress' }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function extractOrderInventoryLines(order: {
  orderItems?: Array<{ product?: unknown; quantity?: number }>
  items?: Array<{ product?: unknown; quantity?: number }>
}): OrderInventoryLine[] {
  const raw = order.orderItems?.length ? order.orderItems : order.items || []
  return raw
    .filter((line) => line?.product && Number(line.quantity) > 0)
    .map((line) => ({
      product: String(line.product),
      quantity: Number(line.quantity),
    }))
}

export async function rollbackInventoryAdjustments(
  results: InventoryAdjustResult[],
): Promise<void> {
  for (const result of results) {
    const restoredQty = result.previousQty - result.updatedQty
    if (restoredQty <= 0) continue
    try {
      await incrementInventoryForOrderItem(
        result.productDoc._id.toString(),
        restoredQty,
      )
    } catch (rollbackErr) {
      console.error('[inventory] rollback failed', rollbackErr)
    }
  }
}

export async function applyInventoryForOrderLines(
  lines: OrderInventoryLine[],
): Promise<InventoryAdjustResult[]> {
  if (!lines.length) {
    throw new Error('Order has no inventory lines.')
  }
  return decrementInventoryForOrderItems(lines)
}

function isOrderSuccessfullyFinalized(order: OrderInventorySnapshot) {
  return (
    order.status === 'confirmed' &&
    Boolean(order.inventoryAdjusted) &&
    order.paymentInfo?.status === 'completed'
  )
}

export async function claimInventoryFinalizeLock(
  orderId: string,
): Promise<InventoryFinalizeClaim> {
  await connectToDatabase()

  const existing = await Order.findById(orderId).lean<OrderInventorySnapshot>()
  if (!existing) {
    return { claimed: false, reason: 'not_found' }
  }

  if (isOrderSuccessfullyFinalized(existing)) {
    return { claimed: false, reason: 'already_finalized', order: existing }
  }

  if (
    existing.status === 'cancelled' &&
    existing.inventoryFailureReason &&
    existing.paymentInfo?.status === 'completed'
  ) {
    return { claimed: false, reason: 'inventory_failed', order: existing }
  }

  const staleCutoff = new Date(Date.now() - FINALIZE_LOCK_STALE_MS)

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      inventoryAdjusted: { $ne: true },
      $or: [
        { inventoryFinalizing: { $ne: true } },
        { inventoryFinalizing: true, updatedAt: { $lt: staleCutoff } },
      ],
    },
    { $set: { inventoryFinalizing: true } },
    { new: true },
  )

  if (!order) {
    const current = await Order.findById(orderId).lean<OrderInventorySnapshot>()
    if (current && isOrderSuccessfullyFinalized(current)) {
      return { claimed: false, reason: 'already_finalized', order: current }
    }
    return { claimed: false, reason: 'in_progress' }
  }

  return { claimed: true, order }
}

export async function claimInventoryFinalizeLockWithRetry(
  orderId: string,
): Promise<InventoryFinalizeClaim> {
  for (let attempt = 0; attempt < FINALIZE_LOCK_MAX_ATTEMPTS; attempt++) {
    const claim = await claimInventoryFinalizeLock(orderId)
    if (claim.claimed || claim.reason !== 'in_progress') {
      return claim
    }
    await sleep(FINALIZE_LOCK_RETRY_MS * (attempt + 1))
  }
  return { claimed: false, reason: 'in_progress' }
}

export async function releaseInventoryFinalizeLock(orderId: string): Promise<void> {
  await connectToDatabase()
  await Order.updateOne({ _id: orderId }, { $set: { inventoryFinalizing: false } })
}

export async function commitInventoryFinalize(
  orderId: string,
  update: Record<string, unknown>,
): Promise<boolean> {
  await connectToDatabase()
  const committed = await Order.findOneAndUpdate(
    { _id: orderId, inventoryAdjusted: { $ne: true } },
    {
      $set: {
        ...update,
        inventoryAdjusted: true,
        inventoryFinalizing: false,
      },
      $unset: { inventoryFailureReason: '', inventoryReservedAt: '' },
    },
    { new: true },
  )
  return Boolean(committed)
}
