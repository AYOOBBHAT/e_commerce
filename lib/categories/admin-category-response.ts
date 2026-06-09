import Product from '@/models/Product'

export const CATEGORY_DEACTIVATION_WARNING =
  'This category still contains active products.' as const

export async function getCategoryDeactivationWarning(
  categorySlug: string,
  nextIsActive: boolean,
  previousIsActive: boolean,
): Promise<string | undefined> {
  if (nextIsActive || !previousIsActive) {
    return undefined
  }

  const productCount = await Product.countDocuments({ category: categorySlug })
  if (productCount > 0) {
    return CATEGORY_DEACTIVATION_WARNING
  }

  return undefined
}
