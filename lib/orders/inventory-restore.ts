import { incrementInventoryForOrderItem } from '@/lib/cart/validation.server'

type OrderLine = {
  product?: unknown
  quantity?: number
}

type OrderLike = {
  inventoryAdjusted?: boolean
  orderItems?: OrderLine[]
  items?: OrderLine[]
}

export async function restoreInventoryForOrder(order: OrderLike): Promise<boolean> {
  if (!order.inventoryAdjusted) {
    return false
  }

  const lines = order.orderItems?.length ? order.orderItems : order.items || []

  for (const line of lines) {
    if (!line?.product) continue
    await incrementInventoryForOrderItem(
      String(line.product),
      Number(line.quantity || 0),
    )
  }

  return true
}
