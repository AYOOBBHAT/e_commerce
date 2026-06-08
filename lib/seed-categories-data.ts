import { getFallbackCategories } from '../lib/category-fallback'

export function getSeedCategoryDocuments() {
  return getFallbackCategories().map((category) => ({
    slug: category.slug,
    name: category.name,
    image: category.image,
    imageAlt: category.imageAlt,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    hideWhenEmpty: category.hideWhenEmpty,
  }))
}
