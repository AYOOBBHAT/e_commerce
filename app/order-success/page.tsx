"use client";

import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return setLoading(false);
      try {
        // Use the public read endpoint for order summary so redirects from payment gateways (guest flows)
        // don't fail due to missing auth cookies. This endpoint returns minimal safe data for public polling.
        const res = await fetch(`/api/orders/public/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('[order-success] fetch order error', err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  return (
    <div className="container max-w-xl mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4 text-green-600">Order Successful!</h1>
      <p className="mb-6">Thank you for your purchase. Your order has been placed and is being processed.</p>
      {orderId && (
        <p className="mb-2">Order ID: <span className="font-mono font-semibold">{orderId}</span></p>
      )}
      {loading ? (
        <div>Loading order summary...</div>
      ) : order ? (
        <div className="mb-6 text-left">
          <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
          <div><strong>Name:</strong> {order.user?.name || order.customer?.name || 'Guest'}</div>
          <div><strong>Email:</strong> {order.user?.email || order.customer?.email || '—'}</div>
          <div><strong>Shipping Address:</strong> {typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.raw || JSON.stringify(order.shippingAddress))}</div>
          <div><strong>Payment Method:</strong> {order.paymentMethod || order.paymentInfo?.method || '—'}</div>
          <div><strong>Status:</strong> {order.status || order.paymentInfo?.status || '—'}</div>
          <div><strong>Total:</strong> ₹{order.total ?? order.totalPrice ?? '—'}</div>
          <div className="mt-2">
            <strong>Items:</strong>
            <ul className="list-disc ml-6">
              {(order.items || order.orderItems || []).map((item: any, idx: number) => (
                <li key={item.product || idx}>{item.name || 'Item'} x {item.quantity || 0} (₹{item.price || 0})</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mb-6">Order details not found.</div>
      )}
      <p className="mb-6">You will receive a confirmation email/SMS soon. You can track your order status in <Button variant="link" onClick={() => router.push('/account/orders')}>My Orders</Button>.</p>
      <Button variant="default" onClick={() => router.push('/products')}>Continue Shopping</Button>
    </div>
  );
}
