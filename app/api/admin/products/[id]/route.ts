import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { invalidateProductCache } from '@/lib/actions/products';
import {
  sanitizeProductImageMeta,
  validateFeaturedProduct,
} from '@/lib/product-image-quality';
import { validateProductCategorySlug } from '@/lib/categories/product-category';
import {
  applyAdminProductInventoryAdjustment,
  parseInventoryAdjustment,
} from '@/lib/admin/product-inventory';
import {
  getForbiddenInventoryPatchFields,
  getUnexpectedProductPatchFields,
  pickAdminProductPatchData,
} from '@/lib/admin/product-patch';
import {
  buildProductAuditFields,
  buildScalarChangedFields,
} from '@/lib/audit/admin-metadata';
import { writeAdminAuditEvent } from '@/lib/audit/write-audit-event';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

const PRODUCT_AUDIT_FIELDS = ['price', 'category', 'featured'];

async function revalidateProductPaths(product: {
  slug?: string;
  category?: string;
}) {
  try {
    revalidatePath('/products');
    revalidatePath('/products/featured');
    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`);
      await invalidateProductCache(product.slug, product.category);
    }
    if (product?.category) {
      revalidatePath(`/category/${product.category}`);
    }
    revalidatePath('/');
  } catch (e) {
    console.warn('revalidatePath failed:', e);
  }
}

async function maybeSendLowInventoryAlert(
  product: { _id?: { toString(): string }; name?: string; quantity?: number },
  previousQuantity: number,
) {
  if (
    typeof product.quantity === 'number' &&
    product.quantity <= 10 &&
    previousQuantity > 10
  ) {
    try {
      const { sendLowInventoryAlert } = await import('@/lib/email-service');
      await sendLowInventoryAlert({
        productName: product.name || 'Unknown Product',
        productId: product._id?.toString() || '',
        currentQuantity: product.quantity || 0,
        threshold: 10,
      });
    } catch (alertErr) {
      console.error('Error sending low inventory alert:', alertErr);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    await connectToDatabase();
    const product = await Product.findById(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(product, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    await connectToDatabase();
    const body = (await request.json()) as Record<string, unknown>;

    const forbiddenInventory = getForbiddenInventoryPatchFields(body);
    if (forbiddenInventory.length > 0) {
      return NextResponse.json(
        {
          error: `Inventory fields cannot be set directly: ${forbiddenInventory.join(', ')}. Use inventoryAdjustment instead.`,
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const unexpectedFields = getUnexpectedProductPatchFields(body);
    if (unexpectedFields.length > 0) {
      return NextResponse.json(
        { error: `Unexpected fields: ${unexpectedFields.join(', ')}` },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const oldProduct = await Product.findById(params.id);
    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const beforeFields = buildProductAuditFields(oldProduct);
    const previousQuantity =
      typeof oldProduct.quantity === 'number' ? oldProduct.quantity : 0;

    let product = oldProduct;
    let inventoryAdjusted = false;

    if (Object.prototype.hasOwnProperty.call(body, 'inventoryAdjustment')) {
      const parsed = parseInventoryAdjustment(body.inventoryAdjustment);
      if (!parsed.ok) {
        return NextResponse.json(
          { error: parsed.error },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        );
      }

      const adjustResult = await applyAdminProductInventoryAdjustment(
        params.id,
        parsed.adjustment,
      );
      if (!adjustResult.ok) {
        return NextResponse.json(
          { error: adjustResult.error },
          { status: adjustResult.status, headers: { 'Cache-Control': 'no-store' } },
        );
      }

      inventoryAdjusted = true;
      writeAdminAuditEvent({
        action: AUDIT_ACTIONS.ADJUST_PRODUCT_INVENTORY,
        adminId: auth.adminId,
        metadata: {
          productId: adjustResult.productId,
          slug: adjustResult.slug,
          adjustment: adjustResult.adjustment,
          before: adjustResult.beforeQty,
          after: adjustResult.afterQty,
        },
      });

      const refreshed = await Product.findById(params.id);
      if (!refreshed) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      product = refreshed;

      await maybeSendLowInventoryAlert(product, previousQuantity);
    }

    const patchData = pickAdminProductPatchData(body);

    if (Array.isArray(patchData.imageMeta)) {
      patchData.imageMeta = sanitizeProductImageMeta(patchData.imageMeta);
    }

    const mergedFeatured =
      patchData.featured !== undefined
        ? Boolean(patchData.featured)
        : Boolean(product.featured);
    const mergedImages =
      patchData.images !== undefined ? patchData.images : product.images || [];
    const mergedImageMeta =
      patchData.imageMeta !== undefined ? patchData.imageMeta : product.imageMeta || [];

    const featuredError = validateFeaturedProduct({
      featured: mergedFeatured,
      images: mergedImages as string[],
      imageMeta: mergedImageMeta as Parameters<typeof validateFeaturedProduct>[0]['imageMeta'],
    });
    if (featuredError) {
      return NextResponse.json({ error: featuredError }, { status: 400 });
    }

    if (Object.prototype.hasOwnProperty.call(patchData, 'category')) {
      const categoryValidation = await validateProductCategorySlug(
        patchData.category as string,
      );
      if (!categoryValidation.ok) {
        return NextResponse.json({ error: categoryValidation.error }, { status: 400 });
      }
      patchData.category = categoryValidation.slug;
    }

    if (Object.keys(patchData).length > 0) {
      const updated = await Product.findByIdAndUpdate(
        params.id,
        { $set: patchData },
        { new: true },
      );

      if (!updated) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      product = updated;
    }

    if (Object.keys(patchData).length > 0 || inventoryAdjusted) {
      await revalidateProductPaths(product);
    }

    if (Object.keys(patchData).length > 0) {
      const changedFields = buildScalarChangedFields(
        beforeFields,
        buildProductAuditFields(product),
        PRODUCT_AUDIT_FIELDS.filter((field) => field in patchData),
      );

      if (changedFields.length > 0) {
        writeAdminAuditEvent({
          action: AUDIT_ACTIONS.UPDATE_PRODUCT,
          adminId: auth.adminId,
          metadata: {
            productId: product._id.toString(),
            slug: product.slug,
            changedFields,
          },
        });
      }
    }

    return NextResponse.json(product, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    await connectToDatabase();
    const product = await Product.findByIdAndDelete(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const revalidated: string[] = [];
    try {
      revalidatePath('/products');
      revalidated.push('/products');
      revalidatePath('/products/featured');
      revalidated.push('/products/featured');
      if (product?.slug) {
        revalidatePath(`/products/${product.slug}`);
        revalidated.push(`/products/${product.slug}`);
        await invalidateProductCache(product.slug, product.category);
      }
      if (product?.category) {
        revalidatePath(`/category/${product.category}`);
        revalidated.push(`/category/${product.category}`);
      }
      revalidatePath('/');
    } catch (e) {
      console.warn('revalidatePath failed:', e);
    }

    writeAdminAuditEvent({
      action: AUDIT_ACTIONS.DELETE_PRODUCT,
      adminId: auth.adminId,
      metadata: {
        productId: product._id.toString(),
        slug: product.slug,
        category: product.category,
      },
    });

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { headers: { 'Cache-Control': 'no-store', 'x-revalidated': revalidated.join(',') } },
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 },
    );
  }
}
