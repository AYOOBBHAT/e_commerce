import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectToDatabase();
  const products = await Product.find().sort({ createdAt: -1 });
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
