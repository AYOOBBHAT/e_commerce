import type { InventoryAdjustResult } from '@/lib/cart/validation.server';
import type { AuditInventoryChange } from '@/lib/audit/types';

export function inventoryChangesFromResults(
  results: InventoryAdjustResult[],
): AuditInventoryChange[] {
  return results.map((result) => ({
    productId: result.productDoc._id.toString(),
    quantityDelta: result.updatedQty - result.previousQty,
    previousQty: result.previousQty,
    updatedQty: result.updatedQty,
  }));
}
