/** Client-safe inventory API types (no server dependencies). */

export type InventoryHealthReport = {
  healthy: boolean;
  negativeStockProducts: number;
  stuckFinalizingOrders: number;
  stuckReservedOrders: number;
  stuckRestoringOrders: number;
  inventoryMismatchOrders: number;
  generatedAt: string;
};

export type ReconciliationConfidence = 'high' | 'medium' | 'low';

export type ProductReconciliationRow = {
  productId: string;
  name: string;
  slug: string;
  actualQuantity: number;
  expectedQuantity: number | null;
  delta: number | null;
  confidence: ReconciliationConfidence;
  notes: string[];
};

export type InventoryReconciliationSummary = {
  totalProducts: number;
  driftedProducts: number;
  highConfidenceProducts: number;
  mediumConfidenceProducts: number;
  lowConfidenceProducts: number;
};

export type InventoryReconciliationReport = {
  generatedAt: string;
  products: ProductReconciliationRow[];
  summary: InventoryReconciliationSummary;
};

export type InventoryMonitoringChecks = {
  negativeStock: boolean;
  stuckFinalizing: boolean;
  stuckReserved: boolean;
  stuckRestoring: boolean;
  inventoryMismatch: boolean;
  driftDetected: boolean;
};

export type InventoryMonitoringReport = {
  healthy: boolean;
  driftDetected: boolean;
  criticalIssues: number;
  warnings: number;
  generatedAt: string;
  checks: InventoryMonitoringChecks;
};
