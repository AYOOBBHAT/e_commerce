"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OrderProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
          if (!aborted) router.replace(`/order-success?orderId=${orderId}`);
          return;
        }
        if (paymentStatus === 'failed') {
          if (!aborted) router.replace(`/order-failed?orderId=${orderId}`);
          return;
        }

        // Continue polling
        setStatus(paymentStatus || 'pending');
      } catch (err) {
        setMessage('Error checking payment status. Retrying...');
      }

      if (!aborted) setTimeout(poll, 3000);
    }

    poll();
    return () => { aborted = true; };
  }, [orderId, router]);

  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Processing your payment...</h1>
      <p className="mb-4">Please do not close this page. We are confirming the payment with the payment gateway.</p>
      <p className="text-sm text-muted">Current status: {status || 'pending'}</p>
      <p className="mt-6">If this takes longer than a minute, check your Orders page or contact support.</p>
    </div>
  );
}
