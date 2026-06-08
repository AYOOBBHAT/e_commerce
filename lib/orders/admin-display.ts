export function getOrderCustomerDisplay(order: {
  user?: { name?: string; email?: string } | null
  customer?: { name?: string; email?: string; phone?: string } | null
}) {
  return {
    name: order.user?.name || order.customer?.name || '—',
    email: order.user?.email || order.customer?.email || '—',
    phone: order.customer?.phone || '—',
  }
}

export function escapeRegex(value: string) {
  return value.replace(/[-\\/^$*+?.()|[\]{}]/g, '\\$&')
}
