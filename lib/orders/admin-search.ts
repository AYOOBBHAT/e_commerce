import mongoose from 'mongoose'
import User from '@/models/User'
import { escapeRegex } from '@/lib/orders/admin-display'

export async function buildAdminOrderSearchFilter(search: string) {
  const trimmed = search.trim()
  if (!trimmed) return null

  const orConditions: Record<string, unknown>[] = []
  const escaped = escapeRegex(trimmed)

  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
    orConditions.push({ _id: trimmed })
  }

  if (trimmed.startsWith('ORD-')) {
    orConditions.push({ orderId: trimmed })
  } else {
    orConditions.push({ orderId: { $regex: `^${escaped}`, $options: 'i' } })
  }

  orConditions.push(
    { 'customer.name': { $regex: escaped, $options: 'i' } },
    { 'customer.email': { $regex: escaped, $options: 'i' } },
    { 'customer.phone': { $regex: escaped, $options: 'i' } },
  )

  const userRegex = new RegExp(escaped, 'i')
  const users = await User.find({
    $or: [{ email: userRegex }, { name: userRegex }],
  }).select('_id')
  if (users.length) {
    orConditions.push({ user: { $in: users.map((u) => u._id) } })
  }

  return { $or: orConditions }
}

export function mergeFilters(
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
