import type { CategoryRecord } from '@/lib/category-types'
import type { CategoryStatsMap } from '@/lib/categories/category-stats'

export function filterStorefrontCategories(
  categories: CategoryRecord[],
  stats: CategoryStatsMap,
): CategoryRecord[] {
  return categories
    .filter((category) => category.isActive)
    .filter(
      (category) =>
        !category.hideWhenEmpty || (stats[category.slug]?.count ?? 0) > 0,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}
