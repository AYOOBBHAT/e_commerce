'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import type { CartItem } from '@/components/CartProvider'
import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider'
import { getShippingDisplay } from '@/lib/shipping'

type CheckoutOrderSummaryProps = {
  cart: CartItem[]
  subtotal: number
  compact?: boolean
}

export default function CheckoutOrderSummary({
  cart,
  subtotal,
  compact = false,
}: CheckoutOrderSummaryProps) {
  const { shipping } = useStorefrontSettings()
  const quote = useMemo(
    () => getShippingDisplay(subtotal, shipping),
    [subtotal, shipping],
  )

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
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
              {(item.variantLabel || item.unitLabel) && (
                <p className="text-xs text-stone-500">{item.variantLabel || item.unitLabel}</p>
              )}
              <p className="mt-1 text-xs text-stone-500">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-stone-900">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Items total</span>
          <span className="font-medium text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Shipping</span>
          <span
            className={
              quote.freeShippingApplied
                ? 'font-medium text-[#B87333]'
                : 'font-medium text-stone-900'
            }
          >
            {quote.shippingLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
        <span className="text-base font-semibold text-stone-900">Order total</span>
        <span className="text-xl font-bold text-stone-900">
          ₹{quote.orderTotal.toLocaleString('en-IN')}
        </span>
      </div>
    </section>
  )
}
