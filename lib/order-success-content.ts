import { CHECKOUT_PAYMENT_UI } from '@/lib/checkout-content'

export type OrderPaymentDisplay = 'paid' | 'pay_on_delivery' | 'payment_processing'

export function resolveOrderPaymentDisplay(
  paymentMethod?: string,
  paymentStatus?: string,
): OrderPaymentDisplay {
  const method = (paymentMethod || '').toLowerCase()
  const status = (paymentStatus || '').toLowerCase()

  if (method === 'cod') return 'pay_on_delivery'
  if (status === 'completed') return 'paid'
  return 'payment_processing'
}

export const ORDER_PAYMENT_STATUS = {
  paid: {
    headline: 'Order confirmed',
    badge: 'Paid',
    message: 'Your payment was received. We are preparing your order.',
  },
  pay_on_delivery: {
    headline: 'Order placed',
    badge: 'Pay on Delivery',
    message: 'Your order is confirmed. Pay when your Kashmir staples arrive.',
  },
  payment_processing: {
    headline: 'Order received',
    badge: 'Payment Processing',
    message:
      'We are confirming your payment with the gateway. You will receive an update shortly.',
  },
} as const

export const ORDER_WHAT_HAPPENS_NEXT = [
  'Orders are processed within 24–48 business hours after confirmation.',
  'Weekend and holiday orders ship on the next working day.',
  'Once dispatched, tracking details are sent via email, SMS, or WhatsApp.',
  'Standard delivery across India typically takes 3–7 working days.',
] as const

export function formatOrderPaymentMethod(method?: string): string {
  if (!method) return '—'
  return CHECKOUT_PAYMENT_UI[method]?.label || method
}

export function formatShippingAddressForDisplay(
  address: unknown,
): string | null {
  if (!address || typeof address !== 'object') {
    if (typeof address === 'string' && address.trim()) return address.trim()
    return null
  }

  const addr = address as Record<string, unknown>

  if (typeof addr.raw === 'string' && addr.raw.trim()) {
    return addr.raw.trim()
  }

  const parts = [
    addr.line1,
    addr.city,
    addr.state,
    addr.pincode ? `PIN ${addr.pincode}` : null,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .map((part) => String(part).trim())

  return parts.length > 0 ? parts.join(', ') : null
}

export function buildWhatsAppSupportUrl(
  orderReference: string,
  storePhone: string,
): string {
  const phone = storePhone.replace(/\D/g, '')
  if (!phone) return '#'
  const text = `Hi, I need help with my order ${orderReference}.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function buildEmailSupportUrl(
  orderReference: string,
  storeEmail: string,
): string {
  if (!storeEmail) return '#'
  const subject = `Order help — ${orderReference}`
  return `mailto:${storeEmail}?subject=${encodeURIComponent(subject)}`
}
