export type AuditInventoryChange = {
  productId: string;
  quantityDelta: number;
  previousQty?: number;
  updatedQty?: number;
};

export type AuditFieldChange = {
  field: string;
  before?: unknown;
  after?: unknown;
};

/** Structured metadata for money, inventory, and admin audit events. */
export type AuditMetadata = {
  provider?: string;
  transactionId?: string;
  paymentStatus?: string;
  inventoryChanges?: AuditInventoryChange[];
  productId?: string;
  quantityDelta?: number;
  paymentMethod?: string;
  source?: string;
  idempotent?: boolean;
  state?: string;
  orderPublicId?: string;
  targetUserId?: string;
  email?: string;
  role?: string;
  categorySlug?: string;
  name?: string;
  isActive?: boolean;
  slug?: string;
  category?: string;
  price?: number;
  quantity?: number;
  featured?: boolean;
  inStock?: boolean;
  adjustment?: number;
  before?: number;
  after?: number;
  changedFields?: AuditFieldChange[];
  categoryOrder?: string[];
};

export const AUDIT_ACTIONS = {
  ORDER_CREATED: 'order_created',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_WEBHOOK_RECEIVED: 'payment_webhook_received',
  INVENTORY_DECREMENTED: 'inventory_decremented',
  INVENTORY_RESTORED: 'inventory_restored',
  INVENTORY_ROLLBACK: 'inventory_rollback',
  UPDATE_ORDER_STATUS: 'update_order_status',
  CLEAR_RATE_LIMIT_KEY: 'clear_rate_limit_key',
  UPDATE_SETTINGS: 'update_settings',
  UPDATE_USER_ROLE: 'update_user_role',
  DELETE_USER: 'delete_user',
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  ADJUST_PRODUCT_INVENTORY: 'adjust_product_inventory',
  DELETE_PRODUCT: 'delete_product',
  CREATE_CATEGORY: 'create_category',
  UPDATE_CATEGORY: 'update_category',
  REORDER_CATEGORIES: 'reorder_categories',
} as const;

export type InventoryAuditContext = {
  orderId?: string;
  source: string;
};

/** Use as audit orderId only when the value is a Mongo ObjectId string. */
export function auditOrderIdFromMerchantRef(ref?: string): string | undefined {
  if (!ref) return undefined;
  return /^[a-f0-9]{24}$/i.test(ref) ? ref : undefined;
}
