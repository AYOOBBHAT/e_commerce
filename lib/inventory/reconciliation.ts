import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Audit from '@/models/Audit';
import type { AuditMetadataRecord } from '@/models/Audit';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

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

const RECONCILIATION_AUDIT_ACTIONS = [
  AUDIT_ACTIONS.CREATE_PRODUCT,
  AUDIT_ACTIONS.ADJUST_PRODUCT_INVENTORY,
  AUDIT_ACTIONS.INVENTORY_DECREMENTED,
  AUDIT_ACTIONS.INVENTORY_RESTORED,
  AUDIT_ACTIONS.INVENTORY_ROLLBACK,
  AUDIT_ACTIONS.UPDATE_PRODUCT,
] as const;

type ReconciliationAuditAction = (typeof RECONCILIATION_AUDIT_ACTIONS)[number];

type TimelineAuditEvent = {
  action: ReconciliationAuditAction;
  createdAt: Date;
  metadata: AuditMetadataRecord;
};

type ProductTimeline = {
  events: TimelineAuditEvent[];
};

type ProductLean = {
  _id: { toString(): string };
  name?: string;
  slug?: string;
  quantity?: number;
};

type AuditLean = {
  action: string;
  createdAt: Date;
  metadata?: AuditMetadataRecord;
};

type OrderInventoryLean = {
  inventoryAdjusted?: boolean;
  orderItems?: Array<{ product?: { toString(): string } | string; quantity?: number }>;
};

type ReplayResult = {
  expectedQuantity: number | null;
  hasCreateAudit: boolean;
  hasLegacyQuantityUpdate: boolean;
  chainBreaks: number;
  movementEventCount: number;
  notes: string[];
};

function isReconciliationAction(action: string): action is ReconciliationAuditAction {
  return (RECONCILIATION_AUDIT_ACTIONS as readonly string[]).includes(action);
}

function normalizeQuantity(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function productIdsFromAudit(audit: AuditLean): string[] {
  const ids = new Set<string>();
  const metadata = audit.metadata;
  if (!metadata) {
    return [];
  }

  if (typeof metadata.productId === 'string' && metadata.productId) {
    ids.add(metadata.productId);
  }

  if (Array.isArray(metadata.inventoryChanges)) {
    for (const change of metadata.inventoryChanges) {
      if (typeof change.productId === 'string' && change.productId) {
        ids.add(change.productId);
      }
    }
  }

  return Array.from(ids);
}

function appendTimelineEvent(
  timelines: Map<string, ProductTimeline>,
  productId: string,
  event: TimelineAuditEvent,
): void {
  const existing = timelines.get(productId);
  if (existing) {
    existing.events.push(event);
    return;
  }
  timelines.set(productId, { events: [event] });
}

function recordChainBreak(
  running: number | null,
  recordedBefore: number | undefined,
  chainBreaks: number,
): number {
  if (
    running !== null &&
    recordedBefore !== undefined &&
    running !== recordedBefore
  ) {
    return chainBreaks + 1;
  }
  return chainBreaks;
}

function applyInventoryChange(
  running: number | null,
  quantityDelta: number | undefined,
  previousQty: number | undefined,
  updatedQty: number | undefined,
  chainBreaks: number,
): { running: number | null; chainBreaks: number } {
  let expected = running;
  let breaks = recordChainBreak(expected, previousQty, chainBreaks);

  if (expected === null && previousQty !== undefined) {
    expected = previousQty;
  }

  if (quantityDelta !== undefined && Number.isFinite(quantityDelta)) {
    expected = (expected ?? 0) + quantityDelta;
  } else if (updatedQty !== undefined) {
    expected = updatedQty;
  }

  return { running: expected, chainBreaks: breaks };
}

function replayProductTimeline(
  productId: string,
  timeline: ProductTimeline,
): ReplayResult {
  const notes: string[] = [];
  let expected: number | null = null;
  let hasCreateAudit = false;
  let hasLegacyQuantityUpdate = false;
  let chainBreaks = 0;
  let movementEventCount = 0;

  const sorted = [...timeline.events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const event of sorted) {
    const metadata = event.metadata;

    switch (event.action) {
      case AUDIT_ACTIONS.CREATE_PRODUCT: {
        if (metadata.productId !== productId) {
          break;
        }
        hasCreateAudit = true;
        const createdQty = normalizeQuantity(metadata.quantity);
        if (createdQty !== undefined) {
          expected = createdQty;
        } else {
          notes.push('create_product audit missing quantity snapshot');
        }
        break;
      }

      case AUDIT_ACTIONS.ADJUST_PRODUCT_INVENTORY: {
        if (metadata.productId !== productId) {
          break;
        }
        movementEventCount += 1;
        const adjustment = normalizeQuantity(metadata.adjustment);
        const beforeQty = normalizeQuantity(metadata.before);
        const afterQty = normalizeQuantity(metadata.after);

        chainBreaks = recordChainBreak(expected, beforeQty, chainBreaks);

        if (expected === null && beforeQty !== undefined) {
          expected = beforeQty;
          notes.push('Baseline inferred from first adjust_product_inventory before quantity');
        }

        if (adjustment !== undefined) {
          expected = (expected ?? 0) + adjustment;
        } else if (afterQty !== undefined) {
          expected = afterQty;
        }

        if (
          beforeQty !== undefined &&
          adjustment !== undefined &&
          afterQty !== undefined &&
          beforeQty + adjustment !== afterQty
        ) {
          notes.push('adjust_product_inventory metadata before+adjustment≠after');
        }
        break;
      }

      case AUDIT_ACTIONS.INVENTORY_DECREMENTED:
      case AUDIT_ACTIONS.INVENTORY_RESTORED: {
        if (!Array.isArray(metadata.inventoryChanges)) {
          break;
        }
        for (const change of metadata.inventoryChanges) {
          if (change.productId !== productId) {
            continue;
          }
          movementEventCount += 1;
          const applied = applyInventoryChange(
            expected,
            normalizeQuantity(change.quantityDelta),
            normalizeQuantity(change.previousQty),
            normalizeQuantity(change.updatedQty),
            chainBreaks,
          );
          expected = applied.running;
          chainBreaks = applied.chainBreaks;
        }
        break;
      }

      case AUDIT_ACTIONS.INVENTORY_ROLLBACK: {
        if (!Array.isArray(metadata.inventoryChanges)) {
          break;
        }
        for (const change of metadata.inventoryChanges) {
          if (change.productId !== productId) {
            continue;
          }
          movementEventCount += 1;
          const decrementDelta = normalizeQuantity(change.quantityDelta);
          const stockBeforeRollback = normalizeQuantity(change.updatedQty);
          const stockAfterRollback = normalizeQuantity(change.previousQty);

          chainBreaks = recordChainBreak(
            expected,
            stockBeforeRollback,
            chainBreaks,
          );

          if (expected === null && stockBeforeRollback !== undefined) {
            expected = stockBeforeRollback;
          }

          if (decrementDelta !== undefined) {
            expected = (expected ?? 0) - decrementDelta;
          } else if (stockAfterRollback !== undefined) {
            expected = stockAfterRollback;
          }
        }
        break;
      }

      case AUDIT_ACTIONS.UPDATE_PRODUCT: {
        if (metadata.productId !== productId) {
          break;
        }
        if (!Array.isArray(metadata.changedFields)) {
          break;
        }
        for (const fieldChange of metadata.changedFields) {
          if (fieldChange.field !== 'quantity') {
            continue;
          }
          hasLegacyQuantityUpdate = true;
          movementEventCount += 1;
          const afterQty = normalizeQuantity(fieldChange.after);
          if (afterQty !== undefined) {
            expected = afterQty;
            notes.push('Legacy update_product absolute quantity set detected');
          }
        }
        break;
      }

      default:
        break;
    }
  }

  if (!hasCreateAudit && expected === null) {
    notes.push('No create_product audit or inferrable baseline');
  }

  if (hasLegacyQuantityUpdate) {
    notes.push('Absolute quantity PATCH history reduces reconciliation accuracy');
  }

  if (chainBreaks > 0) {
    notes.push(`Audit chain continuity breaks: ${chainBreaks}`);
  }

  return {
    expectedQuantity: expected,
    hasCreateAudit,
    hasLegacyQuantityUpdate,
    chainBreaks,
    movementEventCount,
    notes,
  };
}

function deriveConfidence(
  replay: ReplayResult,
  hasOrderAuditSoldMismatch: boolean,
): ReconciliationConfidence {
  if (replay.expectedQuantity === null) {
    return 'low';
  }

  if (
    replay.hasCreateAudit &&
    !replay.hasLegacyQuantityUpdate &&
    replay.chainBreaks === 0 &&
    !hasOrderAuditSoldMismatch
  ) {
    return 'high';
  }

  return 'medium';
}

async function loadOrderSoldQuantities(): Promise<Map<string, number>> {
  const orders = await Order.find({ inventoryAdjusted: true })
    .select('inventoryAdjusted orderItems.product orderItems.quantity')
    .lean<OrderInventoryLean[]>();

  const soldByProduct = new Map<string, number>();

  for (const order of orders) {
    if (!order.inventoryAdjusted || !Array.isArray(order.orderItems)) {
      continue;
    }
    for (const line of order.orderItems) {
      if (!line?.product) {
        continue;
      }
      const productId =
        typeof line.product === 'string'
          ? line.product
          : line.product.toString();
      const qty = normalizeQuantity(line.quantity) ?? 0;
      if (qty <= 0) {
        continue;
      }
      soldByProduct.set(productId, (soldByProduct.get(productId) ?? 0) + qty);
    }
  }

  return soldByProduct;
}

function auditDecrementTotal(
  timeline: ProductTimeline,
  productId: string,
): number {
  let total = 0;
  for (const event of timeline.events) {
    if (event.action !== AUDIT_ACTIONS.INVENTORY_DECREMENTED) {
      continue;
    }
    const changes = event.metadata.inventoryChanges;
    if (!Array.isArray(changes)) {
      continue;
    }
    for (const change of changes) {
      if (change.productId !== productId) {
        continue;
      }
      const delta = normalizeQuantity(change.quantityDelta);
      if (delta !== undefined && delta < 0) {
        total += -delta;
      }
    }
  }
  return total;
}

/** Read-only reconciliation report comparing Product.quantity to audit-derived expectation. */
export async function getInventoryReconciliationReport(
  now: Date = new Date(),
): Promise<InventoryReconciliationReport> {
  await connectToDatabase();

  const [products, audits, orderSoldByProduct] = await Promise.all([
    Product.find().select('name slug quantity').lean<ProductLean[]>(),
    Audit.find({ action: { $in: RECONCILIATION_AUDIT_ACTIONS } })
      .select('action createdAt metadata')
      .sort({ createdAt: 1 })
      .lean<AuditLean[]>(),
    loadOrderSoldQuantities(),
  ]);

  const timelines = new Map<string, ProductTimeline>();

  for (const audit of audits) {
    if (!isReconciliationAction(audit.action) || !audit.metadata) {
      continue;
    }

    const event: TimelineAuditEvent = {
      action: audit.action,
      createdAt: audit.createdAt,
      metadata: audit.metadata,
    };

    for (const productId of productIdsFromAudit(audit)) {
      appendTimelineEvent(timelines, productId, event);
    }
  }

  const rows: ProductReconciliationRow[] = products.map((product) => {
    const productId = product._id.toString();
    const actualQuantity = normalizeQuantity(product.quantity) ?? 0;
    const timeline = timelines.get(productId) ?? { events: [] };

    const replay = replayProductTimeline(productId, timeline);
    const notes = [...replay.notes];

    const orderSoldQty = orderSoldByProduct.get(productId);
    const auditSoldQty = auditDecrementTotal(timeline, productId);
    const hasOrderAuditSoldMismatch =
      orderSoldQty !== undefined && auditSoldQty !== orderSoldQty;

    if (hasOrderAuditSoldMismatch) {
      notes.push(
        `Order inventoryAdjusted sold total (${orderSoldQty}) differs from audit decrement total (${auditSoldQty})`,
      );
    }

    const confidence = deriveConfidence(replay, hasOrderAuditSoldMismatch);

    const expectedQuantity = replay.expectedQuantity;
    const delta =
      expectedQuantity === null ? null : actualQuantity - expectedQuantity;

    if (delta !== null && delta !== 0) {
      notes.push(
        delta > 0
          ? `Actual quantity exceeds audit-derived expectation by ${delta}`
          : `Actual quantity is below audit-derived expectation by ${Math.abs(delta)}`,
      );
    }

    return {
      productId,
      name: product.name ?? 'Unnamed product',
      slug: product.slug ?? '',
      actualQuantity,
      expectedQuantity,
      delta,
      confidence,
      notes,
    };
  });

  rows.sort((a, b) => {
    const absA = a.delta === null ? -1 : Math.abs(a.delta);
    const absB = b.delta === null ? -1 : Math.abs(b.delta);
    return absB - absA;
  });

  const summary: InventoryReconciliationSummary = {
    totalProducts: rows.length,
    driftedProducts: rows.filter((row) => row.delta !== null && row.delta !== 0)
      .length,
    highConfidenceProducts: rows.filter((row) => row.confidence === 'high')
      .length,
    mediumConfidenceProducts: rows.filter((row) => row.confidence === 'medium')
      .length,
    lowConfidenceProducts: rows.filter((row) => row.confidence === 'low').length,
  };

  return {
    generatedAt: now.toISOString(),
    products: rows,
    summary,
  };
}
