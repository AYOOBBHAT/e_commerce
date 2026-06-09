import { getInventoryHealthReport } from '@/lib/inventory/health';
import { getInventoryReconciliationReport } from '@/lib/inventory/reconciliation';
import type { InventoryHealthReport } from '@/lib/inventory/types';
import type { InventoryMonitoringReport } from '@/lib/inventory/types';
import type { InventoryReconciliationReport } from '@/lib/inventory/types';
import {
  getAlertSummary,
  sortAlerts,
  type AdminAlertsResponse,
  type AlertItem,
} from '@/lib/alerts/types';

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Critical + warning alerts from inventory health counters. */
export function generateInventoryHealthAlerts(
  health: InventoryHealthReport,
  createdAt: string = health.generatedAt,
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (health.negativeStockProducts > 0) {
    alerts.push({
      id: 'inventory-negative-stock',
      severity: 'critical',
      category: 'inventory',
      title: 'Negative stock detected',
      description: `${health.negativeStockProducts} ${pluralize(
        health.negativeStockProducts,
        'product has',
        'products have',
      )} negative stock.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (health.inventoryMismatchOrders > 0) {
    alerts.push({
      id: 'inventory-order-mismatch',
      severity: 'critical',
      category: 'inventory',
      title: 'Order inventory state mismatch',
      description: `${health.inventoryMismatchOrders} ${pluralize(
        health.inventoryMismatchOrders,
        'order has',
        'orders have',
      )} an inventory state mismatch.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (health.stuckFinalizingOrders > 0) {
    alerts.push({
      id: 'inventory-stuck-finalizing',
      severity: 'critical',
      category: 'inventory',
      title: 'Stuck inventory finalization',
      description: `${health.stuckFinalizingOrders} ${pluralize(
        health.stuckFinalizingOrders,
        'order is',
        'orders are',
      )} stuck in inventory finalization.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (health.stuckReservedOrders > 0) {
    alerts.push({
      id: 'inventory-stuck-reserved',
      severity: 'warning',
      category: 'inventory',
      title: 'Stale inventory reservation',
      description: `${health.stuckReservedOrders} ${pluralize(
        health.stuckReservedOrders,
        'order is',
        'orders are',
      )} stuck with a stale inventory reservation.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (health.stuckRestoringOrders > 0) {
    alerts.push({
      id: 'inventory-stuck-restoring',
      severity: 'warning',
      category: 'inventory',
      title: 'Stuck inventory restoration',
      description: `${health.stuckRestoringOrders} ${pluralize(
        health.stuckRestoringOrders,
        'order is',
        'orders are',
      )} stuck in inventory restoration.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  return alerts;
}

/** Drift, confidence, and monitoring info alerts from reconciliation + monitoring. */
export function generateInventoryDriftAlerts(
  reconciliation: InventoryReconciliationReport,
  monitoring: InventoryMonitoringReport,
  createdAt: string = reconciliation.generatedAt,
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (reconciliation.summary.driftedProducts > 0) {
    alerts.push({
      id: 'inventory-drift',
      severity: 'warning',
      category: 'inventory',
      title: 'Inventory drift detected',
      description: `${reconciliation.summary.driftedProducts} ${pluralize(
        reconciliation.summary.driftedProducts,
        'product has',
        'products have',
      )} inventory drift.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (reconciliation.summary.lowConfidenceProducts > 0) {
    alerts.push({
      id: 'inventory-low-confidence',
      severity: 'info',
      category: 'inventory',
      title: 'Low reconciliation confidence',
      description: `${reconciliation.summary.lowConfidenceProducts} ${pluralize(
        reconciliation.summary.lowConfidenceProducts,
        'product has',
        'products have',
      )} low reconciliation confidence — audit history may be incomplete.`,
      createdAt,
      auditHistoryAvailable: true,
    });
  }

  if (monitoring.warnings > 0) {
    alerts.push({
      id: 'inventory-monitoring-warnings',
      severity: 'info',
      category: 'inventory',
      title: 'Monitoring warnings active',
      description: `Inventory monitoring reported ${monitoring.warnings} warning-level ${pluralize(
        monitoring.warnings,
        'signal',
        'signals',
      )} requiring review.`,
      createdAt: monitoring.generatedAt,
      auditHistoryAvailable: false,
    });
  }

  return alerts;
}

/** Read-only aggregate of all inventory operational alerts. */
export async function getAdminInventoryAlerts(
  now: Date = new Date(),
): Promise<AdminAlertsResponse> {
  const [health, reconciliation] = await Promise.all([
    getInventoryHealthReport(now),
    getInventoryReconciliationReport(now),
  ]);

  const monitoringWarnings =
    reconciliation.summary.driftedProducts +
    health.stuckReservedOrders +
    health.stuckRestoringOrders;

  const monitoringSnapshot: InventoryMonitoringReport = {
    healthy: false,
    driftDetected: reconciliation.summary.driftedProducts > 0,
    criticalIssues:
      health.negativeStockProducts +
      health.stuckFinalizingOrders +
      health.inventoryMismatchOrders,
    warnings: monitoringWarnings,
    generatedAt: now.toISOString(),
    checks: {
      negativeStock: health.negativeStockProducts > 0,
      stuckFinalizing: health.stuckFinalizingOrders > 0,
      stuckReserved: health.stuckReservedOrders > 0,
      stuckRestoring: health.stuckRestoringOrders > 0,
      inventoryMismatch: health.inventoryMismatchOrders > 0,
      driftDetected: reconciliation.summary.driftedProducts > 0,
    },
  };

  const alerts = sortAlerts([
    ...generateInventoryHealthAlerts(health, health.generatedAt),
    ...generateInventoryDriftAlerts(
      reconciliation,
      monitoringSnapshot,
      reconciliation.generatedAt,
    ),
  ]);

  return {
    generatedAt: now.toISOString(),
    alerts,
    summary: getAlertSummary(alerts),
  };
}
