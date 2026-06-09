import type { AuditFieldChange } from '@/lib/audit/types';
import type { Settings } from '@/lib/settings';

const IMAGE_FIELD_MARK = '[redacted]';

/** Build field-level diffs; image-like fields record presence only, not payloads. */
export function buildScalarChangedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
  options?: { redactFields?: string[] },
): AuditFieldChange[] {
  const redact = new Set(options?.redactFields ?? ['image', 'imagePublicId', 'imageAlt', 'images', 'imageMeta']);
  const changes: AuditFieldChange[] = [];

  for (const field of fields) {
    if (!(field in after)) continue;
    const prev = before[field];
    const next = after[field];
    if (Object.is(prev, next)) continue;

    if (redact.has(field)) {
      changes.push({ field, before: IMAGE_FIELD_MARK, after: IMAGE_FIELD_MARK });
      continue;
    }

    changes.push({ field, before: prev, after: next });
  }

  return changes;
}

export function buildProductAuditFields(product: {
  price?: number;
  quantity?: number;
  category?: string;
  featured?: boolean;
  inStock?: boolean;
}): Record<string, unknown> {
  return {
    price: product.price,
    quantity: product.quantity,
    category: product.category,
    featured: product.featured,
    inStock: product.inStock,
  };
}

export function buildCategoryAuditFields(category: {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
  hideWhenEmpty?: boolean;
  image?: string;
  imagePublicId?: string;
  imageAlt?: string;
}): Record<string, unknown> {
  return {
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    hideWhenEmpty: category.hideWhenEmpty,
    image: category.image,
    imagePublicId: category.imagePublicId,
    imageAlt: category.imageAlt,
  };
}

function flattenSettings(settings: Settings): Record<string, unknown> {
  return {
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    maintenanceMode: settings.maintenanceMode,
    'paymentMethods.phonepe': settings.paymentMethods.phonepe,
    'paymentMethods.razorpay': settings.paymentMethods.razorpay,
    'paymentMethods.cashfree': settings.paymentMethods.cashfree,
    'paymentMethods.cod': settings.paymentMethods.cod,
    'shipping.freeShippingThreshold': settings.shipping.freeShippingThreshold,
    'shipping.defaultRate': settings.shipping.defaultRate,
    'notifications.orderConfirmation': settings.notifications.orderConfirmation,
    'notifications.shippingUpdates': settings.notifications.shippingUpdates,
    'notifications.lowInventory': settings.notifications.lowInventory,
    'notifications.marketing': settings.notifications.marketing,
  };
}

function flattenSettingsUpdates(updates: Partial<Settings>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  if (updates.storeName !== undefined) flat.storeName = updates.storeName.trim();
  if (updates.storeEmail !== undefined) flat.storeEmail = updates.storeEmail.trim();
  if (updates.storePhone !== undefined) flat.storePhone = updates.storePhone.trim();
  if (updates.maintenanceMode !== undefined) flat.maintenanceMode = updates.maintenanceMode;

  if (updates.paymentMethods) {
    if (updates.paymentMethods.phonepe !== undefined) {
      flat['paymentMethods.phonepe'] = updates.paymentMethods.phonepe;
    }
    if (updates.paymentMethods.razorpay !== undefined) {
      flat['paymentMethods.razorpay'] = updates.paymentMethods.razorpay;
    }
    if (updates.paymentMethods.cashfree !== undefined) {
      flat['paymentMethods.cashfree'] = updates.paymentMethods.cashfree;
    }
    if (updates.paymentMethods.cod !== undefined) {
      flat['paymentMethods.cod'] = updates.paymentMethods.cod;
    }
  }

  if (updates.shipping) {
    if (updates.shipping.freeShippingThreshold !== undefined) {
      flat['shipping.freeShippingThreshold'] = updates.shipping.freeShippingThreshold;
    }
    if (updates.shipping.defaultRate !== undefined) {
      flat['shipping.defaultRate'] = updates.shipping.defaultRate;
    }
  }

  if (updates.notifications) {
    if (updates.notifications.orderConfirmation !== undefined) {
      flat['notifications.orderConfirmation'] = updates.notifications.orderConfirmation;
    }
    if (updates.notifications.shippingUpdates !== undefined) {
      flat['notifications.shippingUpdates'] = updates.notifications.shippingUpdates;
    }
    if (updates.notifications.lowInventory !== undefined) {
      flat['notifications.lowInventory'] = updates.notifications.lowInventory;
    }
    if (updates.notifications.marketing !== undefined) {
      flat['notifications.marketing'] = updates.notifications.marketing;
    }
  }

  return flat;
}

export function buildSettingsChangedFields(
  before: Settings,
  updates: Partial<Settings>,
): AuditFieldChange[] {
  const beforeFlat = flattenSettings(before);
  const afterFlat = { ...beforeFlat, ...flattenSettingsUpdates(updates) };
  const fields = Object.keys(flattenSettingsUpdates(updates));
  return buildScalarChangedFields(beforeFlat, afterFlat, fields);
}
