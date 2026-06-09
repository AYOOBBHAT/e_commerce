'use server'

import { cache } from 'react'
import { revalidatePath, revalidateTag } from 'next/cache'
import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'
import { getCached, invalidateByTags } from '@/lib/redis'
import { CacheKeys } from '@/lib/cache-keys'
import { useDbCategories } from '@/lib/category-config'
import { getFallbackCategories } from '@/lib/category-fallback'
import { filterStorefrontCategories } from '@/lib/category-utils'
import {
  getCategoryStats,
  type CategoryStatsMap,
} from '@/lib/categories/category-stats'

import type { CategoryRecord, NavCategory } from '@/lib/category-types'

export type { CategoryRecord, NavCategory } from '@/lib/category-types'

function serializeCategory(doc: CategoryRecord): CategoryRecord {
  return {
    slug: doc.slug,
    name: doc.name,
    image: doc.image,
    imagePublicId: doc.imagePublicId || undefined,
    imageAlt: doc.imageAlt,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    hideWhenEmpty: doc.hideWhenEmpty,
  }
}

async function fetchCategoriesFromDb(): Promise<CategoryRecord[]> {
  await connectToDatabase()
  const rows = await Category.find().sort({ sortOrder: 1, name: 1 }).lean<CategoryRecord[]>()
  return rows.map((row) => serializeCategory(row))
}

export async function getAllCategories(): Promise<CategoryRecord[]> {
  if (!useDbCategories()) {
    return getFallbackCategories()
  }

  return getCached(
    CacheKeys.categories.all(),
    fetchCategoriesFromDb,
    { ttl: 3600, tags: [CacheKeys.tags.categories] },
  )
}

async function resolveCategoryCatalogImpl(): Promise<CategoryRecord[]> {
  if (!useDbCategories()) {
    return getFallbackCategories()
  }

  const fromDb = await getAllCategories()
  if (fromDb.length === 0) {
    return getFallbackCategories()
  }
  return fromDb
}

/** Request-scoped memo for category catalog resolution. */
export const resolveCategoryCatalog = cache(resolveCategoryCatalogImpl)

export type StorefrontCategoryPresentation = {
  categories: CategoryRecord[]
  stats: CategoryStatsMap
}

const loadStorefrontCategoryPresentation = cache(
  async (): Promise<StorefrontCategoryPresentation> => {
    const [stats, catalog] = await Promise.all([
      getCategoryStats(),
      resolveCategoryCatalog(),
    ])
    return {
      stats,
      categories: filterStorefrontCategories(catalog, stats),
    }
  },
)

export async function getStorefrontCategories(
  stats?: CategoryStatsMap,
): Promise<CategoryRecord[]> {
  if (stats !== undefined) {
    const catalog = await resolveCategoryCatalog()
    return filterStorefrontCategories(catalog, stats)
  }
  const { categories } = await loadStorefrontCategoryPresentation()
  return categories
}

export async function getNavCategories(): Promise<NavCategory[]> {
  const { categories } = await loadStorefrontCategoryPresentation()
  return categories.map(({ slug, name }) => ({ slug, name }))
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryRecord | null> {
  const catalog = await resolveCategoryCatalog()
  return catalog.find((category) => category.slug === slug) ?? null
}

export async function getCategoryNameMap(): Promise<Record<string, string>> {
  const catalog = await resolveCategoryCatalog()
  return catalog.reduce<Record<string, string>>((acc, category) => {
    acc[category.slug] = category.name
    return acc
  }, {})
}

export async function invalidateCategoryCache(slug?: string) {
  await invalidateByTags([CacheKeys.tags.categories])

  revalidatePath('/', 'layout')
  revalidatePath('/')

  if (slug) {
    revalidatePath(`/category/${slug}`)
    revalidateTag(CacheKeys.tags.category(slug))
  }
}

/** Homepage grid: same stats + filter snapshot as layout nav (request-memoized). */
export async function getStorefrontCategoryPresentation(): Promise<StorefrontCategoryPresentation> {
  return loadStorefrontCategoryPresentation()
}
