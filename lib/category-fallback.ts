import { PRODUCT_CATEGORIES } from './constants'
import { CATEGORY_VISUALS } from './category-content'
import type { CategoryRecord } from './category-types'

export function getFallbackCategories(): CategoryRecord[] {
  const visualsById = new Map(CATEGORY_VISUALS.map((entry) => [entry.id, entry]))

  return PRODUCT_CATEGORIES.map((category, index) => {
    const visual = visualsById.get(category.id)
    return {
      slug: category.id,
      name: category.name,
      image: visual?.image ?? '',
      imageAlt: visual?.imageAlt ?? `${category.name} collection from Zescoh`,
      sortOrder: index,
      isActive: true,
      hideWhenEmpty: true,
    }
  })
}
