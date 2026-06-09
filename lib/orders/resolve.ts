import mongoose, { type HydratedDocument } from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import Order, { type IOrder } from '@/models/Order'

export async function findOrderByPublicId(
  id: string,
): Promise<HydratedDocument<IOrder> | null> {
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
