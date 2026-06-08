import Image from 'next/image'
import type { CartItem } from '@/components/CartProvider'

type CheckoutOrderSummaryProps = {
  cart: CartItem[]
  total: number
  compact?: boolean
}

export default function CheckoutOrderSummary({
  cart,
  total,
  compact = false,
}: CheckoutOrderSummaryProps) {
  return (
    <section
      className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/[0.03] sm:p-5"
      aria-labelledby="checkout-order-summary"
    >
      <h2
        id="checkout-order-summary"
        className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500"
      >
        Order Summary
      </h2>

      <ul className={`mt-4 space-y-4 ${compact ? 'max-h-48 overflow-y-auto pr-1' : ''}`}>
        {cart.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F2] ring-1 ring-stone-200/80">
              <Image
                src={item.image || '/fallback.png'}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-stone-900">
                {item.name}
              </p>
              {(item.variantLabel || item.unitLabel) && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {item.variantLabel || item.unitLabel}
                </p>
              )}
              <p className="mt-1 text-xs text-stone-500">Qty {item.quantity}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-stone-900">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2 border-t border-stone-100 pt-4 text-sm">
        <div className="flex items-center justify-between text-stone-600">
          <span>Subtotal</span>
          <span>₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between text-stone-600">
          <span>Shipping</span>
          <span className="text-[#4A6741]">Calculated at dispatch</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
        <span className="text-base font-semibold text-stone-900">Total</span>
        <span className="text-xl font-bold text-stone-900">
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>
    </section>
  )
}
