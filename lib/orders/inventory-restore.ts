import { connectToDatabase } from '@/lib/db'
import Order from '@/models/Order'
import {
  incrementInventoryForOrderItem,
  type InventoryAdjustResult,
} from '@/lib/cart/validation.server'
import { invalidateCategoryStatsCache } from '@/lib/categories/category-stats'
import { inventoryChangesFromResults } from '@/lib/audit/inventory-metadata'
import { writeAuditEvent } from '@/lib/audit/write-audit-event'
import { AUDIT_ACTIONS, type InventoryAuditContext } from '@/lib/audit/types'

const RESTORE_CLAIM_STALE_MS = 5 * 60 * 1000

type OrderLine = {
  product?: unknown
  quantity?: number
}

export type OrderRestoreSnapshot = {
  _id?: { toString(): string }
  inventoryAdjusted?: boolean
  inventoryRestoring?: boolean
  inventoryRestoreClaimedAt?: Date
  inventoryRestoreStockApplied?: boolean
  orderItems?: OrderLine[]
  items?: OrderLine[]
}

export type InventoryRestoreClaimResult =
  | { status: 'claimed'; order: OrderRestoreSnapshot }
  | { status: 'already_restored' }
  | { status: 'not_eligible' }
  | { status: 'in_progress' }

export type InventoryRestoreOutcome =
  | 'restored'
  | 'already_restored'
  | 'not_eligible'
  | 'in_progress'

function extractRestoreLines(order: OrderRestoreSnapshot): OrderLine[] {
  return order.orderItems?.length ? order.orderItems : order.items || []
}

/** Atomic restore mutex — keeps inventoryAdjusted true until restore completes. */
export async function claimInventoryRestore(
  orderId: string,
): Promise<InventoryRestoreClaimResult> {
  await connectToDatabase()

  const existing = await Order.findById(orderId)
    .select('inventoryAdjusted inventoryRestoring inventoryRestoreClaimedAt')
    .lean<OrderRestoreSnapshot>()

  if (!existing) {
    return { status: 'not_eligible' }
  }

  if (!existing.inventoryAdjusted) {
    return { status: 'already_restored' }
  }

  const staleCutoff = new Date(Date.now() - RESTORE_CLAIM_STALE_MS)

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      inventoryAdjusted: true,
      $or: [
        { inventoryRestoring: { $ne: true } },
        { inventoryRestoring: true, inventoryRestoreClaimedAt: { $lt: staleCutoff } },
        { inventoryRestoring: true, inventoryRestoreClaimedAt: { $exists: false } },
      ],
    },
    {
      $set: {
        inventoryRestoring: true,
        inventoryRestoreClaimedAt: new Date(),
      },
    },
    { new: true },
  )
    .select(
      'inventoryAdjusted inventoryRestoring inventoryRestoreClaimedAt inventoryRestoreStockApplied orderItems items',
    )
    .lean<OrderRestoreSnapshot>()

  if (!order) {
    const current = await Order.findById(orderId)
      .select('inventoryAdjusted inventoryRestoring')
      .lean<OrderRestoreSnapshot>()
    if (!current?.inventoryAdjusted) {
      return { status: 'already_restored' }
    }
    if (current.inventoryRestoring) {
      return { status: 'in_progress' }
    }
    return { status: 'not_eligible' }
  }

  return { status: 'claimed', order }
}

/** Marks stock increment finished so crash recovery can complete without re-incrementing. */
export async function markInventoryRestoreStockApplied(orderId: string): Promise<void> {
  await connectToDatabase()
  await Order.updateOne(
    { _id: orderId, inventoryRestoring: true },
    { $set: { inventoryRestoreStockApplied: true } },
  )
}

/** Clears restore flags after stock has been returned to Product.quantity. */
export async function completeInventoryRestore(orderId: string): Promise<boolean> {
  await connectToDatabase()
  const completed = await Order.findOneAndUpdate(
    {
      _id: orderId,
      inventoryRestoring: true,
      inventoryAdjusted: true,
    },
    {
      $set: { inventoryAdjusted: false, inventoryRestoring: false },
      $unset: {
        inventoryRestoreClaimedAt: '',
        inventoryRestoreStockApplied: '',
      },
    },
  )
  return Boolean(completed)
}

/** Releases a restore claim without clearing inventoryAdjusted — allows retry after failure. */
export async function releaseInventoryRestoreClaim(orderId: string): Promise<void> {
  await connectToDatabase()
  await Order.updateOne(
    { _id: orderId, inventoryRestoring: true },
    {
      $set: { inventoryRestoring: false },
      $unset: {
        inventoryRestoreClaimedAt: '',
        inventoryRestoreStockApplied: '',
      },
    },
  )
}

async function applyInventoryRestoreLines(
  order: OrderRestoreSnapshot,
): Promise<InventoryAdjustResult[]> {
  const lines = extractRestoreLines(order)
  const restoreResults: InventoryAdjustResult[] = []

  for (const line of lines) {
    if (!line?.product) continue
    const result = await incrementInventoryForOrderItem(
      String(line.product),
      Number(line.quantity || 0),
    )
    if (result) restoreResults.push(result)
  }

  await invalidateCategoryStatsCache()
  return restoreResults
}

/**
 * Claim, restore stock, and complete — only the claim winner increments Product.quantity.
 * Crash recovery: if inventoryRestoreStockApplied is set, completes without re-incrementing.
 */
export async function restoreInventoryWithClaim(
  orderId: string,
  auditContext: InventoryAuditContext,
): Promise<InventoryRestoreOutcome> {
  const claim = await claimInventoryRestore(orderId)
  if (claim.status !== 'claimed') {
    return claim.status
  }

  const { order } = claim

  try {
    if (order.inventoryRestoreStockApplied) {
      const completed = await completeInventoryRestore(orderId)
      return completed ? 'restored' : 'already_restored'
    }

    const restoreResults = await applyInventoryRestoreLines(order)
    await markInventoryRestoreStockApplied(orderId)

    const completed = await completeInventoryRestore(orderId)
    if (!completed) {
      await releaseInventoryRestoreClaim(orderId)
      return 'already_restored'
    }

    if (restoreResults.length > 0) {
      void writeAuditEvent({
        action: AUDIT_ACTIONS.INVENTORY_RESTORED,
        orderId,
        metadata: {
          source: auditContext.source,
          inventoryChanges: inventoryChangesFromResults(restoreResults),
        },
      })
    }

    return 'restored'
  } catch (error) {
    await releaseInventoryRestoreClaim(orderId)
    throw error
  }
}
