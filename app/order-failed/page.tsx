'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Loader2, RotateCcw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider'
import CheckoutTrustStrip from '@/components/checkout/CheckoutTrustStrip'

const FAILURE_MESSAGES: Record<string, string> = {
  payment_failed: 'Your payment could not be completed.',
  cancelled: 'Payment was cancelled before completion.',
  timeout: 'Payment confirmation timed out.',
}

export default function OrderFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const reasonParam = searchParams.get('reason')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders/public/${orderId}`)
        if (res.ok) {
          setOrder(await res.json())
        }
      } catch (err) {
        console.error('[order-failed] fetch order error', err)
      } finally {
        setLoading(false)
      }
    }
    void fetchOrder()
  }, [orderId])

  const failureReason =
    (reasonParam && FAILURE_MESSAGES[reasonParam]) ||
    (order?.paymentInfo?.status === 'failed'
      ? 'Your payment could not be completed.'
      : reasonParam?.replace(/_/g, ' ') ||
        'We could not confirm your payment for this order.')

  const { storeName } = useStorefrontSettings()

  const displayOrderId = order?.orderId || orderId

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:py-14">
      <div className="container mx-auto max-w-lg">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2]">
            <AlertCircle className="h-8 w-8 text-[#B87333]" aria-hidden />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            {storeName}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-stone-900 sm:text-3xl">
            Payment not completed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{failureReason}</p>

          {displayOrderId && (
            <p className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-2.5 font-mono text-sm text-stone-700">
              {displayOrderId}
            </p>
          )}

          {loading ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Checking order status…
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm leading-relaxed text-stone-600">
            No amount should have been charged if payment failed. If money was deducted,
            it is usually reversed within a few business days. You can retry checkout or
            return to your cart to review items.
          </p>
        </div>

        <div className="mt-6">
          <CheckoutTrustStrip />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => router.push('/checkout')}
            className="h-11 rounded-full bg-stone-900 text-white hover:bg-stone-800"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#B87333]" aria-hidden />
              Retry payment
            </span>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-stone-300 bg-white text-stone-900 hover:bg-[#FAF7F2]"
          >
            <Link href="/cart" className="inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#B87333]" aria-hidden />
              Return to cart
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          Need help?{' '}
          <Link
            href="/quick-links/faq"
            className="font-semibold text-[#B87333] hover:text-stone-900"
          >
            Visit FAQ
          </Link>
          {orderId ? (
            <>
              {' '}
              with order reference{' '}
              <span className="font-mono text-stone-800">{displayOrderId}</span>
            </>
          ) : null}
          .
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-stone-700 hover:text-stone-900"
          >
            Continue shopping
            <ArrowRight className="h-4 w-4 text-[#B87333]" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}
