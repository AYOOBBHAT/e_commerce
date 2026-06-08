'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/SessionProvider'
import { SITE_NAME } from '@/lib/constants'
import CheckoutTrustStrip from '@/components/checkout/CheckoutTrustStrip'
import {
  ORDER_PAYMENT_STATUS,
  ORDER_SUCCESS_SUPPORT,
  ORDER_WHAT_HAPPENS_NEXT,
  buildEmailSupportUrl,
  buildWhatsAppSupportUrl,
  formatOrderPaymentMethod,
  resolveOrderPaymentDisplay,
} from '@/lib/order-success-content'

type PublicOrder = {
  orderId?: string
  id?: string
  customer?: { name?: string; email?: string }
  hasAccount?: boolean
  shippingAddress?: string | null
  paymentMethod?: string
  paymentInfo?: { status?: string; method?: string }
  orderItems?: Array<{
    name?: string
    quantity?: number
    price?: number
    image?: string
    variantLabel?: string
    product?: string
  }>
  total?: number
  totalPrice?: number
}

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { user, isLoading: sessionLoading } = useSession()
  const [order, setOrder] = useState<PublicOrder | null>(null)
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

  const items = order?.orderItems || []
  const total = order?.total ?? order?.totalPrice
  const displayOrderId = order?.orderId || orderId || ''
  const paymentMethod = order?.paymentMethod || order?.paymentInfo?.method
  const paymentStatus = order?.paymentInfo?.status

  const paymentDisplay = useMemo(
    () => resolveOrderPaymentDisplay(paymentMethod, paymentStatus),
    [paymentMethod, paymentStatus],
  )
  const statusCopy =
    loading || !order
      ? {
          headline: 'Order confirmed',
          badge: '',
          message: `Thank you for choosing ${SITE_NAME}. Your order details are loading below.`,
        }
      : ORDER_PAYMENT_STATUS[paymentDisplay]

  const customerName = order?.customer?.name
  const customerEmail = order?.customer?.email
  const isLoggedInViewer = Boolean(user?.id)
  const showViewOrders = isLoggedInViewer

  const whatsAppUrl = displayOrderId
    ? buildWhatsAppSupportUrl(displayOrderId)
    : buildWhatsAppSupportUrl('')

  const emailSupportUrl = displayOrderId
    ? buildEmailSupportUrl(displayOrderId)
    : `mailto:${ORDER_SUCCESS_SUPPORT.email}`

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
            {statusCopy.headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {statusCopy.message}
          </p>
          {statusCopy.badge ? (
            <p className="mt-3 inline-flex rounded-full bg-[#FAF7F2] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#B87333]">
              {statusCopy.badge}
            </p>
          ) : null}

          {displayOrderId && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Order reference
              </p>
              <p className="mt-1 rounded-xl bg-[#FAF7F2] px-4 py-2.5 font-mono text-sm text-stone-700">
                {displayOrderId}
              </p>
            </div>
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
                {customerName && (
                  <div className="flex justify-between gap-4">
                    <dt>Name</dt>
                    <dd className="text-right font-medium text-stone-900">
                      {customerName}
                    </dd>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="flex justify-between gap-4">
                    <dt className="shrink-0">Delivery to</dt>
                    <dd className="text-right font-medium text-stone-900">
                      {order.shippingAddress}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt>Payment</dt>
                  <dd className="text-right font-medium text-stone-900">
                    {formatOrderPaymentMethod(paymentMethod)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Status</dt>
                  <dd className="text-right font-medium text-stone-900">
                    {statusCopy.badge}
                  </dd>
                </div>
                {total != null && (
                  <div className="flex justify-between gap-4 border-t border-stone-100 pt-3">
                    <dt className="font-semibold text-stone-900">Item total</dt>
                    <dd className="text-lg font-bold text-stone-900">
                      ₹{Number(total).toLocaleString('en-IN')}
                    </dd>
                  </div>
                )}
              </dl>

              {items.length > 0 && (
                <ul className="mt-5 space-y-3 border-t border-stone-100 pt-4">
                  {items.map((item, idx) => (
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
                        {item.variantLabel && (
                          <p className="mt-0.5 text-xs text-stone-500">
                            {item.variantLabel}
                          </p>
                        )}
                        <p className="text-stone-500">
                          Qty {item.quantity || 0} · ₹
                          {Number(item.price || 0).toLocaleString('en-IN')} each
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

        <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
            What happens next
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-600">
            {ORDER_WHAT_HAPPENS_NEXT.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B87333]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-stone-500">
            Full details in our{' '}
            <Link
              href="/quick-links/shipping-returns"
              className="font-semibold text-[#B87333] hover:text-stone-900"
            >
              Shipping &amp; Returns policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
            Need help?
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Our team can help with order {displayOrderId ? (
              <span className="font-mono text-stone-800">{displayOrderId}</span>
            ) : (
              'reference'
            )}
            .
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="h-11 flex-1 rounded-full border-stone-300 bg-white text-stone-900 hover:bg-[#FAF7F2]"
            >
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-[#B87333]" aria-hidden />
                WhatsApp support
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 flex-1 rounded-full border-stone-300 bg-white text-stone-900 hover:bg-[#FAF7F2]"
            >
              <a
                href={emailSupportUrl}
                className="inline-flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4 text-[#B87333]" aria-hidden />
                Email support
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <CheckoutTrustStrip />
        </div>

        {!sessionLoading && (
          <p className="mt-6 text-center text-sm text-stone-600">
            {showViewOrders ? (
              <>
                Track updates in{' '}
                <button
                  type="button"
                  onClick={() => router.push('/account/orders')}
                  className="font-semibold text-[#B87333] hover:text-stone-900"
                >
                  View Orders
                </button>
                .
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#B87333]" aria-hidden />
                  Check your email
                </span>
                {customerEmail ? (
                  <>
                    {' '}
                    at{' '}
                    <span className="font-medium text-stone-800">
                      {customerEmail}
                    </span>
                  </>
                ) : null}{' '}
                for order updates, or{' '}
                <Link
                  href="/quick-links/faq"
                  className="font-semibold text-[#B87333] hover:text-stone-900"
                >
                  contact support
                </Link>
                .
              </>
            )}
          </p>
        )}

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
