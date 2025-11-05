import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    let query: any = { inStock: true };
    if (category) {
      query.category = category;
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    // Public product listing: short CDN cache for speed, but revalidate quickly
    return NextResponse.json(products, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    // Errors should not be cached
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
