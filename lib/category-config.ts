/** When false, storefront falls back to lib/constants + lib/category-content */
export function useDbCategories(): boolean {
  return process.env.USE_DB_CATEGORIES === 'true'
}
