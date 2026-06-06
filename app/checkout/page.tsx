

declare global {
  interface Window {
    Razorpay?: any;
  }
}
"use client";

import { useState, useEffect } from "react";
import { useCart } from '@/components/CartProvider';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import Script from 'next/script';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function CheckoutPage() {
  // ...existing code...
  const { cart, clearCart } = useCart();
  const router = useRouter();
  // Default payment methods state - will be updated from API
  const defaultPaymentMethods: Record<string, boolean> = {
    phonepe: true,
    razorpay: true,
    cashfree: true,
    cod: true,
  };

  const [activePaymentMethods, setActivePaymentMethods] = useState<Record<string, boolean>>(defaultPaymentMethods);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod", // cod, phonepe, razorpay, cashfree
  });
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [phonepeLoading, setPhonepeLoading] = useState(false);
  const [cashfreeLoading, setCashfreeLoading] = useState(false);

  // Fetch active payment methods on mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const methods = data.paymentMethods || defaultPaymentMethods;
          setActivePaymentMethods(methods);
          
          // Set default payment method to first active one if current selection is disabled
          const isCurrentMethodActive = methods[form.paymentMethod];
          if (!isCurrentMethodActive) {
            const firstActive = PAYMENT_METHODS.find(m => methods[m.id]);
          if (firstActive) {
            setForm(prev => ({ ...prev, paymentMethod: firstActive.id }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        // Keep default methods on error
      }
    };
    fetchPaymentMethods();
  }, []); // Empty deps - only run on mount
  const handlePhonePePayment = async () => {
    // Validate payment method is still active
    if (!activePaymentMethods.phonepe) {
      alert('PhonePe payment is currently disabled. Please select another payment method.');
      return;
    }

    // Validate form before proceeding
    if (!form.name || !form.email || !form.phone || !form.address) {
      alert('Please fill in all required fields before proceeding with payment.');
      return;
    }

    // Validate total amount
    const calculatedTotal = cart.reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);

    if (!calculatedTotal || calculatedTotal <= 0) {
      alert('Invalid cart total. Please add items to your cart.');
      return;
    }

    // Validate window.location
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) {
      alert('Unable to determine website URL. Please refresh the page and try again.');
      return;
    }

    setPhonepeLoading(true);
    try {
      // Create order in backend first to get DB _id for mapping in webhook
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart,
          total: calculatedTotal,
          paymentMethod: 'phonepe',
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created?.id) {
        const msg = created?.error || 'Failed to create order before payment';
        console.error('[checkout] create order failed', created);
        alert(msg);
        throw new Error(msg);
      }

      // Do not send a non-HTTPS redirectUrl to PhonePe (they may reject http://localhost).
      // Only include redirectUrl when it's https or when explicitly allowed via env var.
      const shouldIncludeRedirect = origin.startsWith('https://') || process.env.NEXT_PUBLIC_ALLOW_HTTP_REDIRECT === 'true';
      const requestBody: any = {
        amount: calculatedTotal,
        orderId: created.id, // use DB _id so webhook can update it
      };
      if (shouldIncludeRedirect) {
        requestBody.redirectUrl = `${origin}/order-processing?orderId=${created.id}`;
      } else {
        console.warn('[checkout] Not including redirectUrl to PhonePe because origin is not https and NEXT_PUBLIC_ALLOW_HTTP_REDIRECT !== true');
      }

      console.log('[checkout] PhonePe payment request:', {
        amount: requestBody.amount,
        orderId: requestBody.orderId,
        redirectUrl: requestBody.redirectUrl,
      });

      const res = await fetch('/api/payments/phonepe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (!res.ok) {
        const msg = data?.error?.message || data?.error || 'Failed to initiate PhonePe payment';
        console.error('[checkout] PhonePe payment error:', msg, data);
        alert(msg);
        throw new Error(msg);
      }

      if (!data.data || !data.data.instrumentResponse || !data.data.instrumentResponse.redirectInfo || !data.data.instrumentResponse.redirectInfo.url) {
        console.error('[checkout] Invalid PhonePe response:', data);
        alert('Invalid response from PhonePe: ' + JSON.stringify(data));
        throw new Error('Failed to initiate PhonePe payment');
      }

      // Redirect to PhonePe payment page
      const paymentUrl = data.data.instrumentResponse.redirectInfo.url;
      console.log('[checkout] Redirecting to PhonePe:', paymentUrl);
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error('[checkout] PhonePe payment exception:', err);
      const errorMsg = err?.message || 'PhonePe payment failed. Please try again.';
      alert(errorMsg);
    } finally {
      setPhonepeLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment method is still active
    if (!activePaymentMethods[form.paymentMethod]) {
      alert('Selected payment method is currently disabled. Please select another payment method.');
      return;
    }

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
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Order failed");
      }
      
      const result = await res.json();
      clearCart();
      router.push(`/order-success?orderId=${result.orderId}`);
    } catch (err: any) {
      alert(err.message || "Order failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    // Validate payment method is still active
    if (!activePaymentMethods.razorpay) {
      alert('Razorpay payment is currently disabled. Please select another payment method.');
      return;
    }

    setRazorpayLoading(true);
    try {
      // Validate form before proceeding
      if (!form.name || !form.email || !form.phone || !form.address) {
        alert('Please fill in all required fields before proceeding with payment.');
        return;
      }

      if (!cart.length) {
        alert('Your cart is empty.');
        return;
      }

      const calculatedTotal = cart.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        return sum + (itemPrice * itemQuantity);
      }, 0);

      if (!calculatedTotal || calculatedTotal <= 0) {
        alert('Invalid cart total. Please add items to your cart.');
        return;
      }

      // Create order in backend first so we have an internal id to map Razorpay orders to
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart,
          total: calculatedTotal,
          paymentMethod: 'razorpay',
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created?.id) {
        const msg = created?.error || 'Failed to create order before payment';
        console.error('[checkout] create order failed', created);
        alert(msg);
        throw new Error(msg);
      }

      // Create Razorpay order on backend using our DB id as receipt so we can map it later
      const res = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculatedTotal,
          currency: 'INR',
          receipt: created.id,
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
        handler: async function (response: any) {
          try {
            // Verify payment server-side (immediate fingerprint) and finalize order
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                merchantOrderId: created.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              })
            });
            const v = await verifyRes.json();
            clearCart();
            router.push(`/order-success?orderId=${created.orderId}`);
          } catch (e) {
            console.error('[checkout][razorpay] verification failed', e);
            alert('Payment verification failed. If the amount was deducted, contact support.');
          }
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
    } catch (err) {
      alert('Razorpay payment failed. Please try again.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleCashfreePayment = async () => {
    // Validate payment method is still active
    if (!activePaymentMethods.cashfree) {
      alert('Cashfree payment is currently disabled. Please select another payment method.');
      return;
    }

    setCashfreeLoading(true);
    try {
      // Create order in backend first
      const calculatedTotal = cart.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        return sum + (itemPrice * itemQuantity);
      }, 0);

      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart,
          total: calculatedTotal,
          paymentMethod: 'cashfree',
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created?.id) {
        const msg = created?.error || 'Failed to create order before payment';
        console.error('[checkout] create order failed', created);
        alert(msg);
        throw new Error(msg);
      }

      const res = await fetch('/api/payments/cashfree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculatedTotal,
          orderId: created.id,
          redirectUrl: `${window.location.origin}/order-processing?orderId=${created.id}`,
          customerDetails: {
            customer_id: form.email || `customer_${Date.now()}`,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'Failed to initiate Cashfree payment');
      }
      // Redirect to Cashfree payment page
      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else if (data.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/forms/cashfree/${data.payment_session_id}`;
      } else {
        throw new Error('Failed to get Cashfree payment URL');
      }
    } catch (err: any) {
      alert(err.message || 'Cashfree payment failed. Please try again.');
    } finally {
      setCashfreeLoading(false);
    }
  };

  if (!cart.length) {
    return <div className="container mx-auto px-4 py-12 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Checkout</h1>
      
      {/* Order Summary */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-muted/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.paymentMethod === 'cod') {
            handleSubmit(e);
          } else if (form.paymentMethod === 'phonepe') {
            handlePhonePePayment();
          } else if (form.paymentMethod === 'razorpay') {
            handleRazorpayPayment();
          } else if (form.paymentMethod === 'cashfree') {
            handleCashfreePayment();
          }
        }}
        className="space-y-4 sm:space-y-6 bg-card p-4 sm:p-6 rounded-lg border shadow-sm"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <input 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
            placeholder="Enter your email"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <input 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            required 
            className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
            placeholder="Enter your phone number"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Shipping Address</label>
          <textarea 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            required 
            rows={3}
            className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" 
            placeholder="Enter your complete shipping address"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          {Object.values(activePaymentMethods).some(Boolean) ? (
          <select 
            name="paymentMethod" 
            value={form.paymentMethod} 
            onChange={handleChange} 
            className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              required
          >
            {PAYMENT_METHODS.filter(method => activePaymentMethods[method.id]).map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
          ) : (
            <div className="w-full border border-red-300 rounded-lg px-3 py-2.5 bg-red-50 text-red-700">
              No payment methods available. Please contact support.
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || razorpayLoading || phonepeLoading || cashfreeLoading}
          className="w-full h-12 text-base font-semibold mt-6"
        >
          {isLoading || razorpayLoading || phonepeLoading || cashfreeLoading
            ? "Processing..."
            : form.paymentMethod === 'cod'
            ? "Place Order"
            : form.paymentMethod === 'phonepe'
            ? "Proceed to Pay (PhonePe)"
            : form.paymentMethod === 'razorpay'
            ? "Proceed to Pay (Razorpay)"
            : "Proceed to Pay (Cashfree)"}
        </Button>
      </form>
    </div>
  );
}
