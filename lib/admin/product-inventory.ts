import Product from '@/models/Product';

export type InventoryAdjustmentParseResult =
  | { ok: true; adjustment: number }
  | { ok: false; error: string };

export type AdminInventoryAdjustResult =
  | {
      ok: true;
      productId: string;
      slug?: string;
      adjustment: number;
      beforeQty: number;
      afterQty: number;
    }
  | { ok: false; error: string; status: 400 | 404 };

/** Validate admin inventory adjustment payload (integer, finite, non-zero). */
export function parseInventoryAdjustment(value: unknown): InventoryAdjustmentParseResult {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: 'inventoryAdjustment must be a finite number' };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, error: 'inventoryAdjustment must be an integer' };
  }
  if (value === 0) {
    return { ok: false, error: 'inventoryAdjustment must be non-zero' };
  }
  return { ok: true, adjustment: value };
}

/**
 * Atomically adjust product stock via $inc. Prevents negative resulting quantity.
 * Syncs inStock from quantity after a successful increment/decrement.
 */
export async function applyAdminProductInventoryAdjustment(
  productId: string,
  adjustment: number,
): Promise<AdminInventoryAdjustResult> {
  const existing = await Product.findById(productId).select('quantity slug');
  if (!existing) {
    return { ok: false, error: 'Product not found', status: 404 };
  }

  const beforeQty =
    typeof existing.quantity === 'number' && Number.isFinite(existing.quantity)
      ? existing.quantity
      : 0;

  const filter: { _id: string; quantity?: { $gte: number } } = { _id: productId };
  if (adjustment < 0) {
    filter.quantity = { $gte: -adjustment };
  }

  const productDoc = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: adjustment } },
    { new: true },
  );

  if (!productDoc) {
    return {
      ok: false,
      error: 'Insufficient stock for this adjustment',
      status: 400,
    };
  }

  const afterQty =
    typeof productDoc.quantity === 'number' && Number.isFinite(productDoc.quantity)
      ? productDoc.quantity
      : 0;

  const shouldBeInStock = afterQty > 0;
  if (productDoc.inStock !== shouldBeInStock) {
    productDoc.inStock = shouldBeInStock;
    await productDoc.save();
  }

  return {
    ok: true,
    productId: productDoc._id.toString(),
    slug: productDoc.slug,
    adjustment,
    beforeQty,
    afterQty,
  };
}
