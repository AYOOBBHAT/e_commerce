export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function validateOrderStatusTransition(
  fromStatus: string | undefined,
  toStatus: string,
): { allowed: boolean; error?: string } {
  const from = (fromStatus || 'pending').toLowerCase() as OrderStatus
  const to = toStatus.toLowerCase() as OrderStatus

  if (from === to) {
    return { allowed: true }
  }

  const allowed = ALLOWED_TRANSITIONS[from]
  if (!allowed) {
    return {
      allowed: false,
      error: `Unknown current status "${fromStatus}".`,
    }
  }

  if (!allowed.includes(to)) {
    return {
      allowed: false,
      error: `Cannot change order status from "${from}" to "${to}". Allowed next statuses: ${
        allowed.length ? allowed.join(', ') : 'none (terminal status)'
      }.`,
    }
  }

  return { allowed: true }
}

export function formatPaymentStatusLabel(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'Paid'
    case 'failed':
      return 'Failed'
    case 'pending':
      return 'Pending'
    default:
      return status || '—'
  }
}
