import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import { invalidateProductCache } from '@/lib/actions/products';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    
    // Revalidate public product listing so the updated product reflects immediately
    try {
      revalidatePath('/products');
    } catch (e) {
      console.warn('revalidatePath failed:', e);
    }
    // Revalidate public product listing and the product detail page so the edited product reflects immediately
    let revalidatedPaths = [];
    try {
      revalidatePath('/products');
      revalidatedPaths.push('/products');
      revalidatePath('/products/featured');
      revalidatedPaths.push('/products/featured');
      if (product?.slug) {
        revalidatePath(`/products/${product.slug}`);
        revalidatedPaths.push(`/products/${product.slug}`);
      }
      if (product?.category) {
        revalidatePath(`/category/${product.category}`);
        revalidatedPaths.push(`/category/${product.category}`);
      }
    } catch (e) {
      console.warn('revalidatePath failed:', e);
    }
    return NextResponse.json(product, { headers: { 'Cache-Control': 'no-store', 'x-revalidated': revalidatedPaths.join(',') } });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await connectToDatabase();
    const data = await request.json();
    
    // Get old product data to check if quantity changed
    const oldProduct = await Product.findById(params.id);
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Check for low inventory alert if quantity is low
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
        // Don't fail product update if alert fails
      }
    }
    
    // Revalidate all product-related pages after update
    try {
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
    
    return NextResponse.json(product, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await connectToDatabase();
    const product = await Product.findByIdAndDelete(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    
    // Revalidate public product listing and the product detail page so deletion is reflected immediately
    let revalidated = [];
    try {
      revalidatePath('/products');
      revalidated.push('/products');
      revalidatePath('/products/featured');
      revalidated.push('/products/featured');
      if (product?.slug) {
        revalidatePath(`/products/${product.slug}`);
        revalidated.push(`/products/${product.slug}`);
      }
      if (product?.category) {
        revalidatePath(`/category/${product.category}`);
        revalidated.push(`/category/${product.category}`);
      }
    } catch (e) {
      console.warn('revalidatePath failed:', e);
    }
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { headers: { 'Cache-Control': 'no-store', 'x-revalidated': revalidated.join(',') } }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}