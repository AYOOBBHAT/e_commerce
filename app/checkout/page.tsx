'use client'

declare global {
  interface Window {
    Razorpay?: any
  }
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Script from 'next/script'
import { PAYMENT_METHODS } from '@/lib/constants'
import CheckoutHeader from '@/components/checkout/CheckoutHeader'
import CheckoutTrustStrip from '@/components/checkout/CheckoutTrustStrip'
import CheckoutOrderSummary from '@/components/checkout/CheckoutOrderSummary'
import CheckoutPaymentSelector from '@/components/checkout/CheckoutPaymentSelector'
import CheckoutStickyBar from '@/components/checkout/CheckoutStickyBar'
import {
  buildShippingAddress,
  checkoutInputClass,
  checkoutLabelClass,
  isCheckoutFormComplete,
  type CheckoutFormState,
} from '@/lib/checkout-content'
import { getShippingDisplay } from '@/lib/shipping'
import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider'

const defaultPaymentMethods: Record<string, boolean> = {
  phonepe: true,
  razorpay: true,
  cashfree: true,
  cod: true,
}

function getCtaLabel(paymentMethod: string, loading: boolean) {
  if (loading) return 'Processing…'
  switch (paymentMethod) {
    case 'cod':
      return 'Place Order'
    case 'phonepe':
      return 'Pay with UPI'
    case 'razorpay':
      return 'Pay with Razorpay'
    case 'cashfree':
      return 'Pay with Cashfree'
    default:
      return 'Place Order'
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, syncCart, checkoutBlocked, cartReady, removedItemsNotice } =
    useCart()
  const router = useRouter()

  const [activePaymentMethods, setActivePaymentMethods] =
    useState<Record<string, boolean>>(defaultPaymentMethods)
  const [form, setForm] = useState<CheckoutFormState>({
    name: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [razorpayLoading, setRazorpayLoading] = useState(false)
  const [phonepeLoading, setPhonepeLoading] = useState(false)
  const [cashfreeLoading, setCashfreeLoading] = useState(false)

  const idempotencyKeyRef = useRef<string | null>(null)
  const submitInFlightRef = useRef(false)

  const getIdempotencyKey = useCallback(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    return idempotencyKeyRef.current
  }, [])

  const resetCheckoutSession = useCallback(() => {
    idempotencyKeyRef.current = null
    submitInFlightRef.current = false
  }, [])

  const beginSubmit = useCallback(() => {
    if (submitInFlightRef.current) return false
    submitInFlightRef.current = true
    return true
  }, [])

  const endSubmit = useCallback(() => {
    submitInFlightRef.current = false
  }, [])

  const { shipping } = useStorefrontSettings()

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  )
  const quote = useMemo(
    () => getShippingDisplay(subtotal, shipping),
    [subtotal, shipping],
  )
  const orderTotal = quote.orderTotal
  const isProcessing =
    isLoading || razorpayLoading || phonepeLoading || cashfreeLoading
  const checkoutDisabled = checkoutBlocked || !isCheckoutFormComplete(form)

  const ensureCheckoutReady = useCallback(async (): Promise<number | null> => {
    const result = await syncCart()
    if (!result || result.checkoutBlocked || !result.items.length) {
      alert(
        result?.globalMessage ||
          'One or more items in your cart are unavailable. Please update your cart.',
      )
      router.push('/cart')
      return null
    }
    return result.total
  }, [router, syncCart])

  useEffect(() => {
    if (cartReady && cart.length) {
      void syncCart()
    }
  }, [cartReady, cart.length, syncCart])

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const methods = data.paymentMethods || defaultPaymentMethods
          setActivePaymentMethods(methods)

          setForm((prev) => {
            if (methods[prev.paymentMethod]) return prev
            const firstActive = PAYMENT_METHODS.find((m) => methods[m.id])
            return firstActive
              ? { ...prev, paymentMethod: firstActive.id }
              : prev
          })
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err)
      }
    }
    void fetchPaymentMethods()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const getOrderPayload = useCallback(
    (paymentMethod: string, calculatedTotal: number) => ({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: buildShippingAddress(form),
      paymentMethod,
      idempotencyKey: getIdempotencyKey(),
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image,
        id: item.id,
      })),
      total: calculatedTotal,
    }),
    [form, cart, getIdempotencyKey],
  )

  const handlePhonePePayment = async () => {
    if (!beginSubmit()) return
    if (!activePaymentMethods.phonepe) {
      endSubmit()
      alert('UPI payment is currently disabled. Please select another method.')
      return
    }
    if (!isCheckoutFormComplete(form)) {
      endSubmit()
      alert('Please fill in all required fields before proceeding.')
      return
    }
    if (!orderTotal || orderTotal <= 0) {
      endSubmit()
      alert('Invalid cart total.')
      return
    }

    const validatedTotal = await ensureCheckoutReady()
    if (validatedTotal == null) {
      endSubmit()
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (!origin) {
      endSubmit()
      alert('Unable to determine website URL. Please refresh and try again.')
      return
    }

    setPhonepeLoading(true)
    try {
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getOrderPayload('phonepe', validatedTotal)),
      })
      const created = await createRes.json()
      if (!createRes.ok || !created?.id) {
        throw new Error(created?.error || 'Failed to create order')
      }

      if (created.fromCache) {
        const statusRes = await fetch(`/api/orders/public/${created.id}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData?.paymentInfo?.status === 'completed') {
            clearCart()
            resetCheckoutSession()
            router.push(`/order-success?orderId=${created.id}`)
            return
          }
        }
      }

      const shouldIncludeRedirect =
        origin.startsWith('https://') ||
        process.env.NEXT_PUBLIC_ALLOW_HTTP_REDIRECT === 'true'
      const requestBody: Record<string, unknown> = {
        amount: validatedTotal,
        orderId: created.id,
      }
      if (shouldIncludeRedirect) {
        requestBody.redirectUrl = `${origin}/order-processing?orderId=${created.id}`
      }

      const res = await fetch('/api/payments/phonepe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data?.error?.message || data?.error || 'Failed to initiate UPI payment',
        )
      }

      const paymentUrl =
        data.data?.instrumentResponse?.redirectInfo?.url
      if (!paymentUrl) throw new Error('Invalid payment response')

      window.location.href = paymentUrl
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'UPI payment failed.')
    } finally {
      setPhonepeLoading(false)
      endSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!beginSubmit()) return
    if (!activePaymentMethods[form.paymentMethod]) {
      endSubmit()
      alert('Selected payment method is disabled.')
      return
    }
    if (!isCheckoutFormComplete(form)) {
      endSubmit()
      alert('Please complete all shipping fields.')
      return
    }

    const validatedTotal = await ensureCheckoutReady()
    if (validatedTotal == null) {
      endSubmit()
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getOrderPayload(form.paymentMethod, validatedTotal)),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Order failed')
      }

      const result = await res.json()
      clearCart()
      resetCheckoutSession()
      router.push(`/order-success?orderId=${result.id}`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Order failed. Please try again.')
    } finally {
      setIsLoading(false)
      endSubmit()
    }
  }

  const handleRazorpayPayment = async () => {
    if (!beginSubmit()) return
    if (!activePaymentMethods.razorpay) {
      endSubmit()
      alert('Razorpay is currently disabled.')
      return
    }
    if (!isCheckoutFormComplete(form) || !cart.length || orderTotal <= 0) {
      endSubmit()
      alert('Please complete all fields and ensure your cart is valid.')
      return
    }

    const validatedTotal = await ensureCheckoutReady()
    if (validatedTotal == null) {
      endSubmit()
      return
    }

    setRazorpayLoading(true)
    try {
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getOrderPayload('razorpay', validatedTotal)),
      })
      const created = await createRes.json()
      if (!createRes.ok || !created?.id) {
        throw new Error(created?.error || 'Failed to create order')
      }

      if (created.fromCache) {
        const statusRes = await fetch(`/api/orders/public/${created.id}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData?.paymentInfo?.status === 'completed') {
            clearCart()
            resetCheckoutSession()
            router.push(`/order-success?orderId=${created.id}`)
            return
          }
        }
      }

      const res = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: validatedTotal,
          currency: 'INR',
          receipt: created.id,
        }),
      })
      const order = await res.json()
      if (!order.id) throw new Error('Failed to create Razorpay order')

      if (!window.Razorpay) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          document.body.appendChild(script)
        })
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ZeeShaEla & Co.',
        description: 'Order Payment',
        order_id: order.id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                merchantOrderId: created.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            if (!verifyRes.ok) {
              const data = await verifyRes.json().catch(() => ({}))
              throw new Error(
                data.error ||
                  (verifyRes.status === 409
                    ? 'Item is no longer in stock. If payment was deducted, contact support.'
                    : 'Verification failed'),
              )
            }
            clearCart()
            resetCheckoutSession()
            router.push(`/order-success?orderId=${created.id}`)
          } catch {
            alert(
              'Payment verification failed. Contact support if amount was deducted.',
            )
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: '#292524' },
      }
      new window.Razorpay!(options).open()
    } catch {
      alert('Razorpay payment failed. Please try again.')
    } finally {
      setRazorpayLoading(false)
      endSubmit()
    }
  }

  const handleCashfreePayment = async () => {
    if (!beginSubmit()) return
    if (!activePaymentMethods.cashfree) {
      endSubmit()
      alert('Cashfree is currently disabled.')
      return
    }
    if (!isCheckoutFormComplete(form)) {
      endSubmit()
      alert('Please complete all shipping fields.')
      return
    }

    const validatedTotal = await ensureCheckoutReady()
    if (validatedTotal == null) {
      endSubmit()
      return
    }

    setCashfreeLoading(true)
    try {
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getOrderPayload('cashfree', validatedTotal)),
      })
      const created = await createRes.json()
      if (!createRes.ok || !created?.id) {
        throw new Error(created?.error || 'Failed to create order')
      }

      if (created.fromCache) {
        const statusRes = await fetch(`/api/orders/public/${created.id}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData?.paymentInfo?.status === 'completed') {
            clearCart()
            resetCheckoutSession()
            router.push(`/order-success?orderId=${created.id}`)
            return
          }
        }
      }

      const res = await fetch('/api/payments/cashfree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: validatedTotal,
          orderId: created.id,
          redirectUrl: `${window.location.origin}/order-processing?orderId=${created.id}`,
          customerDetails: {
            customer_id: form.email || `customer_${Date.now()}`,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
          },
        }),
      })
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error.message || 'Failed to initiate Cashfree payment')
      }
      if (data.payment_link) {
        window.location.href = data.payment_link
      } else if (data.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/forms/cashfree/${data.payment_session_id}`
      } else {
        throw new Error('Failed to get payment URL')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cashfree payment failed.')
    } finally {
      setCashfreeLoading(false)
      endSubmit()
    }
  }

  const handlePlaceOrder = () => {
    if (form.paymentMethod === 'cod') void handleSubmit()
    else if (form.paymentMethod === 'phonepe') void handlePhonePePayment()
    else if (form.paymentMethod === 'razorpay') void handleRazorpayPayment()
    else if (form.paymentMethod === 'cashfree') void handleCashfreePayment()
  }

  const ctaLabel = getCtaLabel(form.paymentMethod, isProcessing)

  if (!cartReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] px-4">
        <p className="text-sm text-stone-600">Loading checkout…</p>
      </div>
    )
  }

  if (!cart.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] px-4">
        <div className="max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-stone-900">Your cart is empty</p>
          <p className="mt-2 text-sm text-stone-600">
            Add something from our Kashmir collection to checkout.
          </p>
          <Button
            asChild
            className="mt-6 rounded-full bg-stone-900 text-white hover:bg-stone-800"
          >
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 lg:pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CheckoutHeader />
        <CheckoutTrustStrip />

        {(removedItemsNotice || checkoutBlocked) && (
          <p
            className="mt-6 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-600"
            role="status"
          >
            {removedItemsNotice ||
              'One or more items are unavailable. Return to your cart to resolve.'}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handlePlaceOrder()
              }}
              className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6"
            >
              <section aria-labelledby="shipping-heading">
                <h2
                  id="shipping-heading"
                  className="text-sm font-semibold uppercase tracking-[0.12em] text-[#B87333]"
                >
                  Shipping details
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="name" className={checkoutLabelClass}>
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className={checkoutInputClass}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className={checkoutLabelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className={checkoutInputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className={checkoutLabelClass}>
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      autoComplete="tel"
                      className={checkoutInputClass}
                      placeholder="+91"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="addressLine" className={checkoutLabelClass}>
                      Address
                    </label>
                    <textarea
                      id="addressLine"
                      name="addressLine"
                      value={form.addressLine}
                      onChange={handleChange}
                      required
                      rows={2}
                      autoComplete="street-address"
                      className={`${checkoutInputClass} resize-none`}
                      placeholder="House no., street, landmark"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="city" className={checkoutLabelClass}>
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      autoComplete="address-level2"
                      className={checkoutInputClass}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="state" className={checkoutLabelClass}>
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      required
                      autoComplete="address-level1"
                      className={checkoutInputClass}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                    <label htmlFor="pincode" className={checkoutLabelClass}>
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className={checkoutInputClass}
                      placeholder="6-digit PIN"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-stone-100 pt-6">
                <CheckoutPaymentSelector
                  value={form.paymentMethod}
                  activePaymentMethods={activePaymentMethods}
                  onChange={(methodId) =>
                    setForm((prev) => ({ ...prev, paymentMethod: methodId }))
                  }
                />
              </section>

              <Button
                type="submit"
                disabled={isProcessing || checkoutDisabled}
                className="hidden h-12 w-full rounded-full bg-stone-900 text-base font-semibold text-white hover:bg-stone-800 lg:inline-flex"
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Processing…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4 text-[#B87333]" aria-hidden />
                  </span>
                )}
              </Button>
            </form>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <CheckoutOrderSummary cart={cart} subtotal={subtotal} />
            </div>
          </aside>
        </div>
      </div>

      <CheckoutStickyBar
        total={orderTotal}
        ctaLabel={ctaLabel}
        isLoading={isProcessing}
        disabled={checkoutDisabled}
        onSubmit={handlePlaceOrder}
      />
    </div>
  )
}
