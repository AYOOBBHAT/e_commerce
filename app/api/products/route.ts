import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import { NextRequest } from 'next/server';

// Use dynamic rendering for API routes but with good caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (100 requests per minute)
    const { rateLimit, getClientIdentifier } = await import('@/lib/api-rate-limiter');
    const identifier = getClientIdentifier(request);
    
    const rateLimitResult = await rateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyPrefix: 'products:list',
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const searchQuery = searchParams.get('q');
    let query: any = { inStock: true };
    if (category) {
      query.category = category;
    }
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
      ];
      // allow showing out-of-stock items if explicitly searching
      delete query.inStock;
    }
    const products = await Product.find(query).sort({ createdAt: -1 }).lean();
    // Public product listing: cache with tag-based revalidation
    return NextResponse.json(products, {
      headers: { 
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
      },
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
