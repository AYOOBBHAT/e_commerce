

declare global {
  interface Window {
    Razorpay?: any;
  }
}
"use client";

import { useState } from "react";
import { useCart } from '@/components/CartProvider';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import Script from 'next/script';

export default function CheckoutPage() {
  // ...existing code...
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod", // cod, online, phonepe
  });
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [phonepeLoading, setPhonepeLoading] = useState(false);
  const handlePhonePePayment = async () => {
    setPhonepeLoading(true);
    try {
      const res = await fetch('/api/payments/phonepe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId: `phonepe_${Date.now()}`,
          redirectUrl: `${window.location.origin}/order-success`,
        }),
      });
      const data = await res.json();
      if (!data.data || !data.data.instrumentResponse || !data.data.instrumentResponse.redirectInfo) {
        throw new Error('Failed to initiate PhonePe payment');
      }
      // Redirect to PhonePe payment page
      window.location.href = data.data.instrumentResponse.redirectInfo.url;
    } catch (err) {
      alert('PhonePe payment failed. Please try again.');
    } finally {
      setPhonepeLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart,
          total,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      const result = await res.json();
      clearCart();
      router.push(`/order-success?orderId=${result.orderId}`);
    } catch {
      alert("Order failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setRazorpayLoading(true);
    try {
      // Create Razorpay order on backend
      const res = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        }),
      });
      const order = await res.json();
      if (!order.id) throw new Error('Failed to create Razorpay order');

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // Open Razorpay modal
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: form.name,
        description: 'Order Payment',
        order_id: order.id,
        handler: function (response: any) {
          // On payment success, create order in DB
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              items: cart,
              total,
              paymentMethod: 'online',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            })
          })
            .then(orderRes => orderRes.json())
            .then(result => {
              clearCart();
              router.push(`/order-success?orderId=${result.orderId}`);
            });
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        theme: { color: '#6366f1' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      alert('Payment failed. Please try again.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  if (!cart.length) {
    return <div className="container mx-auto px-4 py-12 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <form
        onSubmit={
          form.paymentMethod === 'cod'
            ? handleSubmit
            : form.paymentMethod === 'online'
            ? (e) => { e.preventDefault(); handleRazorpayPayment(); }
            : (e) => { e.preventDefault(); handlePhonePePayment(); }
        }
        className="space-y-4 bg-card p-6 rounded-lg border"
      >
        <div>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label>Shipping Address</label>
          <input name="address" value={form.address} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label>Payment Method</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="cod">Cash on Delivery</option>
            <option value="online">Online Payment (Razorpay)</option>
            <option value="phonepe">PhonePe</option>
          </select>
        </div>
  <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
        <Button type="submit" disabled={isLoading || razorpayLoading || phonepeLoading}>
          {isLoading || razorpayLoading || phonepeLoading
            ? "Processing..."
            : form.paymentMethod === 'cod'
            ? "Place Order"
            : form.paymentMethod === 'online'
            ? "Proceed to Pay (Razorpay)"
            : "Proceed to Pay (PhonePe)"}
        </Button>
      </form>
    </div>
  );
}
