import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import Order from '@/models/Order'

export async function findOrderByPublicId(id: string) {
  if (!id?.trim()) return null
  await connectToDatabase()

  const trimmed = id.trim()

  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
    const byId = await Order.findById(trimmed)
    if (byId) return byId
  }

  if (trimmed.startsWith('ORD-')) {
    return Order.findOne({ orderId: trimmed })
  }

  return Order.findOne({
    $or: [{ orderId: trimmed }, { orderNumber: trimmed }],
  })
}
