'use server'

import { revalidatePath } from 'next/cache'
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
} from '@/lib/actions/products'

import type { CategoryRecord, NavCategory } from '@/lib/category-types'

export type { CategoryRecord, NavCategory } from '@/lib/category-types'

function serializeCategory(doc: {
  slug: string
  name: string
  image: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
}): CategoryRecord {
  return {
    slug: doc.slug,
    name: doc.name,
    image: doc.image,
    imageAlt: doc.imageAlt,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    hideWhenEmpty: doc.hideWhenEmpty,
  }
}

async function fetchCategoriesFromDb(): Promise<CategoryRecord[]> {
  await connectToDatabase()
  const rows = await Category.find().sort({ sortOrder: 1, name: 1 }).lean()
  return rows.map((row) => serializeCategory(row as unknown as CategoryRecord))
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

export async function resolveCategoryCatalog(): Promise<CategoryRecord[]> {
  if (!useDbCategories()) {
    return getFallbackCategories()
  }

  const fromDb = await getAllCategories()
  if (fromDb.length === 0) {
    return getFallbackCategories()
  }
  return fromDb
}

export async function getStorefrontCategories(
  stats?: CategoryStatsMap,
): Promise<CategoryRecord[]> {
  const statsMap = stats ?? (await getCategoryStats())
  const catalog = await resolveCategoryCatalog()
  return filterStorefrontCategories(catalog, statsMap)
}

export async function getNavCategories(): Promise<NavCategory[]> {
  const categories = await getStorefrontCategories()
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

export async function invalidateCategoryCache() {
  await invalidateByTags([CacheKeys.tags.categories])
  revalidatePath('/')
}
