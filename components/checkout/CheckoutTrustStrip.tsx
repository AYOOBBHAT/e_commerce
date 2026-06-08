import { CHECKOUT_TRUST_ITEMS } from '@/lib/checkout-content'

export default function CheckoutTrustStrip() {
  return (
    <ul
      className="mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:grid-cols-4 sm:gap-3"
      aria-label="Checkout trust signals"
    >
      {CHECKOUT_TRUST_ITEMS.map(({ id, label, icon: Icon }) => (
        <li
          key={id}
          className="flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 text-xs font-medium text-stone-700 sm:text-sm"
        >
          <Icon className="h-4 w-4 shrink-0 text-[#B87333]" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
