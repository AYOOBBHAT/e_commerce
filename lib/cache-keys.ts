// Centralized cache key generation for consistency
// Note: Keys are automatically versioned in lib/redis.ts

export const CacheKeys = {
  // Product cache keys (versioned automatically)
  products: {
    all: (filters?: string) => `products:all${filters ? `:${filters}` : ''}`,
    byId: (id: string) => `products:id:${id}`,
    bySlug: (slug: string) => `products:slug:${slug}`,
    byCategory: (category: string, filters?: string) => 
      `products:category:${category}${filters ? `:${filters}` : ''}`,
    featured: (filters?: string) => `products:featured${filters ? `:${filters}` : ''}`,
    search: (query: string, filters?: string) => 
      `products:search:${encodeURIComponent(query)}${filters ? `:${filters}` : ''}`,
    categories: () => 'products:categories',
  },

  categories: {
    all: () => 'categories:all',
  },

  // Order cache keys (short TTL for sensitive data)
  orders: {
    byUserId: (userId: string, page?: number) => 
      `orders:user:${userId}${page ? `:page:${page}` : ''}`,
    byId: (id: string) => `orders:id:${id}`,
  },

  // Cache tags for invalidation
  tags: {
    products: 'products',
    product: (id: string) => `product:${id}`,
    category: (category: string) => `category:${category}`,
    categories: 'categories',
    orders: 'orders',
    order: (id: string) => `order:${id}`,
  },
} as const;

// Generate cache key hash for filters
export function hashFilters(filters: Record<string, any>): string {
  const sorted = Object.keys(filters)
    .sort()
    .map((key) => `${key}:${String(filters[key])}`)
    .join('|');
  
  // Simple hash (for production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

