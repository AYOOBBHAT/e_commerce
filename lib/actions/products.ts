'use server';

import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { getCached, invalidateByTags } from '@/lib/redis';
import { CacheKeys, hashFilters } from '@/lib/cache-keys';

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// Get all products with optional filtering and pagination
export async function getProducts(
  options: {
    category?: string;
    searchQuery?: string;
    featured?: boolean;
    inStock?: boolean;
    pagination?: PaginationOptions;
  } = {}
): Promise<PaginatedResponse<any>> {
  const { category, searchQuery, featured, inStock = true, pagination } = options;
  const page = pagination?.page || 1;
  // Paginated API calls are capped at 100 per page; use fetchAllProductPages()
  // when a caller needs the full catalog (e.g. /products PLP client-side filters).
  const limit = Math.min(pagination?.limit || 20, 100);
  const skip = (page - 1) * limit;
  
  await connectToDatabase();
  
  let query: any = {};
  
  if (inStock) {
    query.inStock = true;
  }
  
  if (category) {
    query.category = category;
  }
  
  // Use MongoDB text search if available (much faster than regex)
  if (searchQuery) {
    // Try text search first (requires text index)
    try {
      query.$text = { $search: searchQuery };
    } catch {
      // Fallback to regex if text index not available
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
      ];
    }
    // Allow showing out-of-stock items if explicitly searching
    delete query.inStock;
  }
  
  if (featured) {
    query.featured = true;
  }
  
  // Generate cache key
  const filters = { category, searchQuery, featured, inStock, page, limit };
  const filterHash = hashFilters(filters);
  const cacheKey = category
    ? CacheKeys.products.byCategory(category, filterHash)
    : featured
    ? CacheKeys.products.featured(filterHash)
    : CacheKeys.products.all(filterHash);
  
  const tags: string[] = [CacheKeys.tags.products];
  if (category) tags.push(CacheKeys.tags.category(category));
  if (featured) tags.push(CacheKeys.tags.products); // featured is part of products
  
  // Use Redis cache
  const result = await getCached(
    cacheKey,
    async () => {
      // Get total count (for pagination metadata)
      const total = await Product.countDocuments(query);
      
      // Fetch products with pagination
      let sort: any = { createdAt: -1 };
      if (searchQuery && query.$text) {
        // Add text score to sort if using text search
        sort = { score: { $meta: 'textScore' }, createdAt: -1 };
      }
      
      const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      const serialized = JSON.parse(JSON.stringify(products));
      
      // Map images[0] to image for compatibility
      const data = serialized.map((p: any) => ({
        ...p,
        image: p.images?.[0] || '',
      }));
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      };
    },
    {
      ttl: searchQuery ? 300 : 3600, // 5 min for search, 1 hour for listings
      tags,
    }
  );
  
  return result;
}

const MAX_PRODUCTS_PAGE_SIZE = 100;

/** Walk every page so PLP/search callers never silently miss products beyond page 1. */
async function fetchAllProductPages(
  options: {
    category?: string;
    searchQuery?: string;
    featured?: boolean;
    inStock?: boolean;
  } = {},
) {
  const allProducts: Awaited<ReturnType<typeof getProducts>>['data'] = [];
  let page = 1;

  while (true) {
    const result = await getProducts({
      ...options,
      pagination: { page, limit: MAX_PRODUCTS_PAGE_SIZE },
    });
    allProducts.push(...result.data);
    if (!result.pagination.hasMore) {
      return allProducts;
    }
    page += 1;
  }
}

// Full catalog for listing pages that filter/sort client-side (not a single page slice).
export async function getAllProducts(options: {
  category?: string;
  searchQuery?: string;
  featured?: boolean;
  inStock?: boolean;
} = {}) {
  return fetchAllProductPages(options);
}

// Get product by slug with caching
export async function getProductBySlug(slug: string) {
  await connectToDatabase();
  
  const cacheKey = CacheKeys.products.bySlug(slug);
  
  const product = await getCached(
    cacheKey,
    async () => {
      // Try several lookup strategies
      let found = await Product.findOne({ slug }).lean();
      
      if (!found) {
        const decoded = decodeURIComponent(slug);
        if (decoded !== slug) {
          found = await Product.findOne({ slug: decoded }).lean();
        }
      }
      
      if (!found) {
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('^' + escapeRegex(slug) + '$', 'i');
        found = await Product.findOne({ slug: re }).lean();
      }
      
      if (!found && mongoose.isValidObjectId(slug)) {
        found = await Product.findById(slug).lean();
      }
      
      if (!found) {
        return null;
      }
      
      const serialized = JSON.parse(JSON.stringify(found));
      
      return {
        ...serialized,
        image: serialized.images?.[0] || '',
      };
    },
    {
      ttl: 3600, // 1 hour
      tags: [CacheKeys.tags.products, CacheKeys.tags.product(slug)],
    }
  );
  
  return product;
}

// Invalidate product cache (called after product updates)
export async function invalidateProductCache(productSlug?: string, category?: string) {
  const tags: string[] = [CacheKeys.tags.products];
  if (productSlug) tags.push(CacheKeys.tags.product(productSlug));
  if (category) tags.push(CacheKeys.tags.category(category));
  
  await invalidateByTags(tags);
}

// Get featured products
export async function getFeaturedProducts() {
  const result = await getProducts({ featured: true, pagination: { page: 1, limit: 100 } });
  return result.data;
}

// Get products by category (full category catalog, not first page only)
export async function getProductsByCategory(category: string) {
  return fetchAllProductPages({ category });
}

export type CategoryStatsMap = Record<
  string,
  { count: number; fromPrice: number | null }
>;

// Aggregate in-stock product counts and minimum price per category slug
export async function getCategoryStats(): Promise<CategoryStatsMap> {
  await connectToDatabase();

  const rows = await Product.aggregate<{
    _id: string;
    count: number;
    fromPrice: number;
  }>([
    { $match: { inStock: true } },
    {
      $project: {
        category: 1,
        effectiveMinPrice: {
          $min: {
            $concatArrays: [
              ['$price'],
              {
                $map: {
                  input: { $ifNull: ['$variants', []] },
                  as: 'variant',
                  in: '$$variant.price',
                },
              },
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        fromPrice: { $min: '$effectiveMinPrice' },
      },
    },
  ]);

  return rows.reduce<CategoryStatsMap>((acc, row) => {
    acc[row._id] = { count: row.count, fromPrice: row.fromPrice ?? null };
    return acc;
  }, {});
}

export type ProductReviewEntry = {
  productName: string
  productSlug: string
  rating: number
  review: string
  image?: string
}

export async function getRecentReviews(
  limit = 6,
): Promise<ProductReviewEntry[]> {
  await connectToDatabase()

  const products = await Product.find({
    ratings: {
      $elemMatch: { review: { $exists: true, $nin: [null, ''] } },
    },
  })
    .select('name slug ratings images')
    .lean()

  const entries: ProductReviewEntry[] = []

  for (const product of products) {
    for (const rating of product.ratings ?? []) {
      const review = rating.review?.trim()
      if (!review) continue
      entries.push({
        productName: product.name,
        productSlug: product.slug,
        rating: rating.rating,
        review,
        image: product.images?.[0],
      })
    }
  }

  return entries
    .sort((a, b) => b.rating - a.rating || b.review.length - a.review.length)
    .slice(0, limit)
}

