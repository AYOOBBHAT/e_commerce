/** Audit action keywords referenced in reconciliation notes or audit log filters. */
const INVENTORY_AUDIT_ACTION_KEYWORDS = [
  'inventory_decremented',
  'inventory_restored',
  'inventory_rollback',
  'adjust_product_inventory',
  'create_product',
  'legacy update_product',
  'order inventoryadjusted',
  'audit chain',
] as const;

/** True when reconciliation notes or expected quantity suggest audit-backed history. */
export function hasInventoryAuditHistoryIndicator(
  notes: string[],
  expectedQuantity: number | null,
): boolean {
  if (expectedQuantity !== null) {
    return true;
  }

  if (notes.length === 0) {
    return false;
  }

  const normalized = notes.map((note) => note.toLowerCase());
  return normalized.some((note) =>
    INVENTORY_AUDIT_ACTION_KEYWORDS.some((keyword) => note.includes(keyword)),
  );
}

export function inventoryAuditLogHref(): string {
  return '/admin/audits';
}
