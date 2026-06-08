"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { SITE_NAME } from '@/lib/constants';

export default function OrderProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Processing your payment...');

  useEffect(() => {
    if (!orderId) return;
    let aborted = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/public/${orderId}`);
        if (!res.ok) {
          setMessage('Unable to fetch order status. Please check your orders page.');
          return;
        }
        const data = await res.json();
        const paymentStatus = data?.paymentInfo?.status || data?.paymentStatus || null;

        if (paymentStatus === 'completed') {
          if (!aborted) {
            clearCart();
            router.replace(`/order-success?orderId=${orderId}`);
          }
          return;
        }
        if (paymentStatus === 'failed') {
          if (!aborted) {
            router.replace(`/order-failed?orderId=${orderId}&reason=payment_failed`);
          }
          return;
        }

        setStatus(paymentStatus || 'pending');
      } catch {
        setMessage('Error checking payment status. Retrying...');
      }

      if (!aborted) setTimeout(poll, 3000);
    }

    poll();
    return () => { aborted = true; };
  }, [orderId, router, clearCart]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-10 sm:py-14">
      <div className="container mx-auto max-w-lg">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            {SITE_NAME}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-stone-900 sm:text-3xl">
            Processing your payment
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Please do not close this page. We are confirming the payment with the
            payment gateway.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#B87333]" aria-hidden />
            {message}
          </div>

          <p className="mt-4 text-xs text-stone-500">
            Current status: {status || 'pending'}
          </p>

          <p className="mt-6 text-sm text-stone-600">
            If this takes longer than a minute, check your Orders page or contact
            support.
          </p>
        </div>
      </div>
    </div>
  );
}
