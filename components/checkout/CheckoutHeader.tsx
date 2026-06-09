'use client'

import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider'
import { CHECKOUT_HEADER } from '@/lib/checkout-content'

export default function CheckoutHeader() {
  const { storeName } = useStorefrontSettings()

  return (
    <header className="mb-6 text-center sm:mb-8 sm:text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
        {storeName}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold text-stone-900 sm:text-3xl">
        {CHECKOUT_HEADER.title}
      </h1>
      <p className="mt-2 text-sm text-stone-600">{CHECKOUT_HEADER.trustLine}</p>
    </header>
  )
}
