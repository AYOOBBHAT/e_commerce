'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CartStickyBarProps = {
  itemsCount: number
  orderTotal: number
  checkoutBlocked?: boolean
}

export default function CartStickyBar({
  itemsCount,
  orderTotal,
  checkoutBlocked = false,
}: CartStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} · Total
          </p>
          <p className="text-lg font-bold text-stone-900">
            ₹{orderTotal.toLocaleString('en-IN')}
          </p>
        </div>
        {checkoutBlocked ? (
          <Button
            disabled
            className="h-12 flex-1 rounded-full bg-stone-900 text-sm font-semibold text-white opacity-50"
          >
            Proceed to Checkout
          </Button>
        ) : (
          <Button
            asChild
            className="h-12 flex-1 rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
          >
            <Link href="/checkout" className="inline-flex items-center justify-center gap-1.5">
              Proceed to Checkout
              <ArrowRight className="h-4 w-4 text-[#B87333]" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
