'use client'

import { CHECKOUT_PAYMENT_UI } from '@/lib/checkout-content'
import { PAYMENT_METHODS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type CheckoutPaymentSelectorProps = {
  value: string
  activePaymentMethods: Record<string, boolean>
  onChange: (methodId: string) => void
}

export default function CheckoutPaymentSelector({
  value,
  activePaymentMethods,
  onChange,
}: CheckoutPaymentSelectorProps) {
  const available = PAYMENT_METHODS.filter((m) => activePaymentMethods[m.id])

  if (!available.length) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No payment methods available. Please contact support.
      </div>
    )
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-stone-700">Payment method</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {available.map((method) => {
          const ui = CHECKOUT_PAYMENT_UI[method.id] ?? {
            label: method.name,
            description: '',
          }
          const selected = value === method.id

          return (
            <label
              key={method.id}
              className={cn(
                'flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors',
                selected
                  ? 'border-[#B87333] bg-[#FAF7F2] ring-1 ring-[#B87333]/30'
                  : 'border-stone-200 bg-white hover:border-stone-300',
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selected}
                onChange={() => onChange(method.id)}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-stone-900">{ui.label}</span>
              {ui.description ? (
                <span className="mt-0.5 text-xs text-stone-500">{ui.description}</span>
              ) : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
