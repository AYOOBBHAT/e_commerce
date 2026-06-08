'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SITE_NAME } from '@/lib/constants'
import CheckoutTrustStrip from '@/components/checkout/CheckoutTrustStrip'

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
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
        if (!res.ok) throw new Error('Failed to fetch order')
        setOrder(await res.json())
      } catch (err) {
        console.error('[order-success] fetch order error', err)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    void fetchOrder()
  }, [orderId])

  const items = order?.items || order?.orderItems || []
  const total = order?.total ?? order?.totalPrice

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:py-14">
      <div className="container mx-auto max-w-lg">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2]">
            <CheckCircle2 className="h-8 w-8 text-[#B87333]" aria-hidden />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            {SITE_NAME}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-stone-900 sm:text-3xl">
            Order confirmed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Thank you for choosing {SITE_NAME}. Your Kashmir staples are being
            prepared with care.
          </p>

          {orderId && (
            <p className="mt-4 rounded-xl bg-[#FAF7F2] px-4 py-2.5 font-mono text-sm text-stone-700">
              {orderId}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading order details…
            </div>
          ) : order ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
                Order summary
              </h2>
              <dl className="mt-4 space-y-2 text-sm text-stone-600">
                <div className="flex justify-between gap-4">
                  <dt>Name</dt>
                  <dd className="text-right font-medium text-stone-900">
                    {order.user?.name || order.customer?.name || 'Guest'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Payment</dt>
                  <dd className="text-right font-medium capitalize text-stone-900">
                    {order.paymentMethod || order.paymentInfo?.method || '—'}
                  </dd>
                </div>
                {total != null && (
                  <div className="flex justify-between gap-4 border-t border-stone-100 pt-3">
                    <dt className="font-semibold text-stone-900">Total</dt>
                    <dd className="text-lg font-bold text-stone-900">
                      ₹{Number(total).toLocaleString('en-IN')}
                    </dd>
                  </div>
                )}
              </dl>

              {items.length > 0 && (
                <ul className="mt-5 space-y-3 border-t border-stone-100 pt-4">
                  {items.map((item: any, idx: number) => (
                    <li key={item.product || idx} className="flex gap-3">
                      {item.image ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F2]">
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium text-stone-900">
                          {item.name || 'Item'}
                        </p>
                        <p className="text-stone-500">
                          Qty {item.quantity || 0} · ₹
                          {Number(item.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="py-4 text-center text-sm text-stone-500">
              Order details will arrive in your confirmation email shortly.
            </p>
          )}
        </div>

        <div className="mt-6">
          <CheckoutTrustStrip />
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          Confirmation email/SMS on its way. Track status in{' '}
          <button
            type="button"
            onClick={() => router.push('/account/orders')}
            className="font-semibold text-[#B87333] hover:text-stone-900"
          >
            My Orders
          </button>
          .
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="h-11 rounded-full bg-stone-900 text-white hover:bg-stone-800"
          >
            <Link href="/products" className="inline-flex items-center gap-2">
              Continue shopping
              <ArrowRight className="h-4 w-4 text-[#B87333]" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
