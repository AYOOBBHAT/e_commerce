import mongoose from 'mongoose'
import { escapeRegex } from '@/lib/orders/admin-display'

export function buildAdminProductSearchFilter(
  search: string,
  categorySlugsFromName: string[] = [],
) {
  const trimmed = search.trim()
  if (!trimmed) return null

  const orConditions: Record<string, unknown>[] = []
  const escaped = escapeRegex(trimmed)

  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
    orConditions.push({ _id: trimmed })
  }

  orConditions.push(
    { name: { $regex: escaped, $options: 'i' } },
    { slug: { $regex: escaped, $options: 'i' } },
    { category: { $regex: escaped, $options: 'i' } },
  )

  if (categorySlugsFromName.length) {
    orConditions.push({ category: { $in: categorySlugsFromName } })
  }

  return { $or: orConditions }
}

export function mergeProductFilters(
  baseFilter: Record<string, unknown>,
  extraFilter: Record<string, unknown> | null,
) {
  if (!extraFilter || !Object.keys(extraFilter).length) {
    return baseFilter
  }
  if (!Object.keys(baseFilter).length) {
    return extraFilter
  }
  return { $and: [baseFilter, extraFilter] }
}
