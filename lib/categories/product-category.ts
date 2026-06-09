import { connectToDatabase } from '@/lib/db'
import Category from '@/models/Category'

export type ProductCategoryValidation =
  | { ok: true; slug: string }
  | { ok: false; error: string }

export async function validateProductCategorySlug(
  category: unknown,
): Promise<ProductCategoryValidation> {
  if (typeof category !== 'string' || !category.trim()) {
    return { ok: false, error: 'Category is required' }
  }

  const slug = category.trim()
  await connectToDatabase()

  const exists = await Category.findOne({ slug }).select('slug').lean<{ slug: string }>()
  if (!exists) {
    return { ok: false, error: 'Category does not exist' }
  }

  return { ok: true, slug }
}
