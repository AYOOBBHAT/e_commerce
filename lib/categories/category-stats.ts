import { cache } from 'react'
import { connectToDatabase } from '@/lib/db'
import Product from '@/models/Product'
import { getCached, invalidateByTags } from '@/lib/redis'
import { CacheKeys } from '@/lib/cache-keys'

export type CategoryStatsMap = Record<
  string,
  { count: number; fromPrice: number | null }
>

const CATEGORY_STATS_TTL_SECONDS = 300

async function aggregateCategoryStatsFromDb(): Promise<CategoryStatsMap> {
  await connectToDatabase()

  const rows = await Product.aggregate<{
    _id: string
    count: number
    fromPrice: number
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
  ])

  return rows.reduce<CategoryStatsMap>((acc, row) => {
    acc[row._id] = { count: row.count, fromPrice: row.fromPrice ?? null }
    return acc
  }, {})
}

async function loadCategoryStatsFromCache(): Promise<CategoryStatsMap> {
  return getCached(CacheKeys.categories.stats(), aggregateCategoryStatsFromDb, {
    ttl: CATEGORY_STATS_TTL_SECONDS,
    tags: [CacheKeys.tags.categoryStats],
  })
}

/** Request-scoped memo + Redis cache-aside (300s). */
export const getCategoryStats = cache(loadCategoryStatsFromCache)

export async function invalidateCategoryStatsCache(): Promise<void> {
  await invalidateByTags([CacheKeys.tags.categoryStats])
}
