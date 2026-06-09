import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

/** Matches finalize/restore stale reclaim windows in inventory-apply / inventory-restore. */
export const INVENTORY_HEALTH_STALE_MS = 5 * 60 * 1000;

export type InventoryHealthReport = {
  healthy: boolean;
  negativeStockProducts: number;
  stuckFinalizingOrders: number;
  stuckReservedOrders: number;
  stuckRestoringOrders: number;
  inventoryMismatchOrders: number;
  generatedAt: string;
};

function staleCutoffDate(now: Date): Date {
  return new Date(now.getTime() - INVENTORY_HEALTH_STALE_MS);
}

/** Read-only inventory integrity counters for admin monitoring. */
export async function getInventoryHealthReport(
  now: Date = new Date(),
): Promise<InventoryHealthReport> {
  await connectToDatabase();

  const staleCutoff = staleCutoffDate(now);

  const [
    negativeStockProducts,
    stuckFinalizingOrders,
    stuckReservedOrders,
    stuckRestoringOrders,
    inventoryMismatchOrders,
  ] = await Promise.all([
    Product.countDocuments({ quantity: { $lt: 0 } }),
    // Order has no inventoryFinalizeClaimedAt; updatedAt tracks finalize lock touch (see claimInventoryFinalizeLock).
    Order.countDocuments({
      inventoryFinalizing: true,
      updatedAt: { $lt: staleCutoff },
    }),
    Order.countDocuments({
      inventoryReservedAt: { $exists: true, $ne: null, $lt: staleCutoff },
      inventoryAdjusted: { $ne: true },
    }),
    Order.countDocuments({
      inventoryRestoring: true,
      inventoryRestoreClaimedAt: { $exists: true, $ne: null, $lt: staleCutoff },
    }),
    Order.countDocuments({
      $or: [
        { status: 'cancelled', inventoryAdjusted: true },
        {
          'paymentInfo.status': 'completed',
          'paymentInfo.method': { $ne: 'cod' },
          inventoryAdjusted: { $ne: true },
        },
      ],
    }),
  ]);

  const counters = [
    negativeStockProducts,
    stuckFinalizingOrders,
    stuckReservedOrders,
    stuckRestoringOrders,
    inventoryMismatchOrders,
  ];

  return {
    healthy: counters.every((count) => count === 0),
    negativeStockProducts,
    stuckFinalizingOrders,
    stuckReservedOrders,
    stuckRestoringOrders,
    inventoryMismatchOrders,
    generatedAt: now.toISOString(),
  };
}
