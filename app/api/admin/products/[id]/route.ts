import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import { invalidateProductCache } from '@/lib/actions/products';
import {
  sanitizeProductImageMeta,
  validateFeaturedProduct,
} from '@/lib/product-image-quality';

function requireAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const authError = requireAdmin(session);
    if (authError) return authError;

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const authError = requireAdmin(session);
    if (authError) return authError;

    await connectToDatabase();
    const data = await request.json();

    const oldProduct = await Product.findById(params.id);
    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (Array.isArray(data.imageMeta)) {
      data.imageMeta = sanitizeProductImageMeta(data.imageMeta);
    }

    const mergedFeatured =
      data.featured !== undefined ? Boolean(data.featured) : Boolean(oldProduct.featured);
    const mergedImages =
      data.images !== undefined ? data.images : oldProduct.images || [];
    const mergedImageMeta =
      data.imageMeta !== undefined ? data.imageMeta : oldProduct.imageMeta || [];

    const featuredError = validateFeaturedProduct({
      featured: mergedFeatured,
      images: mergedImages,
      imageMeta: mergedImageMeta,
    });
    if (featuredError) {
      return NextResponse.json({ error: featuredError }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true },
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (product.quantity <= 10 && (!oldProduct || oldProduct.quantity > 10)) {
      try {
        const { sendLowInventoryAlert } = await import('@/lib/email-service');
        await sendLowInventoryAlert({
          productName: product.name || 'Unknown Product',
          productId: product._id.toString(),
          currentQuantity: product.quantity || 0,
          threshold: 10,
        });
      } catch (alertErr) {
        console.error('Error sending low inventory alert:', alertErr);
      }
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const authError = requireAdmin(session);
    if (authError) return authError;

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
