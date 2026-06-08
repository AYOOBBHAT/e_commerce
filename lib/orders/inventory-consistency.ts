export type OrderInventorySnapshot = {
  status?: string
  inventoryAdjusted?: boolean
  inventoryFailureReason?: string
  inventoryReservedAt?: Date
  paymentInfo?: { status?: string; method?: string }
}

export type InventoryConsistencyResult = {
  valid: boolean
  issues: string[]
}

export function verifyOrderInventoryConsistency(
  order: OrderInventorySnapshot,
): InventoryConsistencyResult {
  const issues: string[] = []
  const isConfirmed = order.status === 'confirmed'
  const paymentCompleted = order.paymentInfo?.status === 'completed'
  const adjusted = Boolean(order.inventoryAdjusted)
  const isCod = order.paymentInfo?.method === 'cod'

  if (isConfirmed && paymentCompleted && !adjusted) {
    issues.push('Confirmed paid order is missing inventoryAdjusted=true')
  }

  if (isConfirmed && adjusted && !paymentCompleted && !isCod) {
    issues.push('Confirmed prepaid order does not have completed payment status')
  }

  if (adjusted && isConfirmed === false && paymentCompleted && !isCod) {
    issues.push('Prepaid order has inventoryAdjusted=true but is not confirmed')
  }

  if (adjusted && !isConfirmed && isCod && order.status !== 'pending') {
    issues.push('COD order has inventoryAdjusted=true but is not pending or confirmed')
  }

  return { valid: issues.length === 0, issues }
}

export function isPrepaidOrderFinalized(order: OrderInventorySnapshot): boolean {
  return (
    order.status === 'confirmed' &&
    Boolean(order.inventoryAdjusted) &&
    order.paymentInfo?.status === 'completed' &&
    order.paymentInfo?.method !== 'cod'
  )
}
