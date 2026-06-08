'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CheckoutStickyBarProps = {
  total: number
  ctaLabel: string
  isLoading: boolean
  disabled: boolean
  onSubmit: () => void
}

export default function CheckoutStickyBar({
  total,
  ctaLabel,
  isLoading,
  disabled,
  onSubmit,
}: CheckoutStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            Total
          </p>
          <p className="text-lg font-bold text-stone-900">
            ₹{total.toLocaleString('en-IN')}
          </p>
        </div>
        <Button
          type="button"
          disabled={disabled || isLoading}
          onClick={onSubmit}
          className="h-12 flex-1 rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Processing…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {ctaLabel}
              <ArrowRight className="h-4 w-4 text-[#B87333]" aria-hidden />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
