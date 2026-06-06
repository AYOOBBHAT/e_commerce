import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/actions/products';

// Optimized search endpoint with caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category');
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Debounce: reject queries that are too short or common
    if (query.length < 2) {
      return NextResponse.json({ data: [], pagination: { hasMore: false } });
    }

    // Use server action which handles caching and MongoDB text search
    const result = await getAllProducts({
      searchQuery: query,
      category: category || undefined,
      inStock: false, // Show all products in search
    });

    return NextResponse.json(
      { data: result, pagination: { hasMore: false } },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

