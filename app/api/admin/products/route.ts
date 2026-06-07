import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import { invalidateProductCache } from '@/lib/actions/products';
import { validateFeaturedProduct } from '@/lib/product-image-quality';

export async function GET() {
  try {
    await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 });
  // Admin product listing must always be fresh
  return NextResponse.json(products, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const data = await request.json();

    const featuredError = validateFeaturedProduct({
      featured: Boolean(data.featured),
      images: data.images || [],
      imageMeta: data.imageMeta,
    });
    if (featuredError) {
      return NextResponse.json({ error: featuredError }, { status: 400 });
    }
    
  const product = await Product.create(data);
  // Revalidate public product listing so the new product shows up immediately
  try {
    // Revalidate all product-related paths
    revalidatePath('/products');
    revalidatePath('/products/featured');
    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`);
      // Invalidate Redis cache
      await invalidateProductCache(product.slug, product.category);
    }
    if (product?.category) {
      revalidatePath(`/category/${product.category}`);
    }
  } catch (e) {
    console.warn('revalidatePath failed:', e);
  }
  return NextResponse.json(product, { status: 201, headers: { 'Cache-Control': 'no-store', 'x-revalidated': `products,products/${product?.slug || ''}` } });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}