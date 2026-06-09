import { getInventoryHealthReport } from '@/lib/inventory/health';
import { getInventoryReconciliationReport } from '@/lib/inventory/reconciliation';
import type { InventoryMonitoringReport } from '@/lib/inventory/types';

/** Aggregates health + reconciliation into monitoring signals for admin dashboards. */
export async function getInventoryMonitoringReport(
  now: Date = new Date(),
): Promise<InventoryMonitoringReport> {
  const [health, reconciliation] = await Promise.all([
    getInventoryHealthReport(now),
    getInventoryReconciliationReport(now),
  ]);

  const driftDetected = reconciliation.summary.driftedProducts > 0;

  const checks = {
    negativeStock: health.negativeStockProducts > 0,
    stuckFinalizing: health.stuckFinalizingOrders > 0,
    stuckReserved: health.stuckReservedOrders > 0,
    stuckRestoring: health.stuckRestoringOrders > 0,
    inventoryMismatch: health.inventoryMismatchOrders > 0,
    driftDetected,
  };

  const criticalIssues =
    health.negativeStockProducts +
    health.stuckFinalizingOrders +
    health.inventoryMismatchOrders;

  const warnings =
    reconciliation.summary.driftedProducts +
    health.stuckReservedOrders +
    health.stuckRestoringOrders;

  const healthy = criticalIssues === 0 && warnings === 0;

  return {
    healthy,
    driftDetected,
    criticalIssues,
    warnings,
    generatedAt: now.toISOString(),
    checks,
  };
}
