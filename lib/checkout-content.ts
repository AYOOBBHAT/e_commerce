import { PackageCheck, ShieldCheck, Headphones, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CHECKOUT_HEADER = {
  title: 'Secure Checkout',
  trustLine: 'Handmade in Kashmir • Secure Payments • Pan-India Delivery',
} as const

export const CHECKOUT_TRUST_ITEMS: {
  id: string
  label: string
  icon: LucideIcon
}[] = [
  { id: 'secure', label: 'Secure Payments', icon: ShieldCheck },
  { id: 'packed', label: 'Freshly Packed', icon: PackageCheck },
  { id: 'delivery', label: 'Pan-India Delivery', icon: Truck },
  { id: 'support', label: 'Customer Support', icon: Headphones },
]

export const CHECKOUT_PAYMENT_UI: Record<
  string,
  { label: string; description: string }
> = {
  phonepe: {
    label: 'UPI',
    description: 'PhonePe, GPay & UPI apps',
  },
  razorpay: {
    label: 'Razorpay',
    description: 'UPI, cards & wallets',
  },
  cod: {
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives',
  },
  cashfree: {
    label: 'Cashfree',
    description: 'Cards & net banking',
  },
}

export const checkoutInputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-stone-900 placeholder:text-stone-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-0'

export const checkoutLabelClass = 'text-sm font-medium text-stone-700'

export type CheckoutFormState = {
  name: string
  email: string
  phone: string
  addressLine: string
  city: string
  state: string
  pincode: string
  paymentMethod: string
}

export function buildShippingAddress(form: CheckoutFormState) {
  const raw = [
    form.addressLine,
    form.city,
    form.state,
    form.pincode ? `PIN ${form.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return {
    line1: form.addressLine,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
    raw,
  }
}

export function isCheckoutFormComplete(form: CheckoutFormState) {
  return Boolean(
    form.name &&
      form.email &&
      form.phone &&
      form.addressLine &&
      form.city &&
      form.state &&
      form.pincode,
  )
}
