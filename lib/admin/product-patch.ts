/** Fields allowed on admin product PATCH (inventory excluded). */
export const ADMIN_PRODUCT_PATCH_FIELDS = [
  'name',
  'slug',
  'description',
  'price',
  'comparePrice',
  'unitLabel',
  'category',
  'featured',
  'variants',
  'images',
  'imageMeta',
] as const;

export type AdminProductPatchField = (typeof ADMIN_PRODUCT_PATCH_FIELDS)[number];

const PATCH_FIELD_SET = new Set<string>(ADMIN_PRODUCT_PATCH_FIELDS);

/** Inventory fields that must not be written via generic product PATCH. */
export const FORBIDDEN_INVENTORY_PATCH_FIELDS = [
  'quantity',
  'inStock',
] as const;

const FORBIDDEN_INVENTORY_SET = new Set<string>(FORBIDDEN_INVENTORY_PATCH_FIELDS);

export function getForbiddenInventoryPatchFields(
  body: Record<string, unknown>,
): string[] {
  return Object.keys(body).filter((key) => FORBIDDEN_INVENTORY_SET.has(key));
}

export function getUnexpectedProductPatchFields(
  body: Record<string, unknown>,
): string[] {
  return Object.keys(body).filter(
    (key) => key !== 'inventoryAdjustment' && !PATCH_FIELD_SET.has(key),
  );
}

export function pickAdminProductPatchData(
  body: Record<string, unknown>,
): Partial<Record<AdminProductPatchField, unknown>> {
  const patch: Partial<Record<AdminProductPatchField, unknown>> = {};
  for (const field of ADMIN_PRODUCT_PATCH_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      patch[field] = body[field];
    }
  }
  return patch;
}
