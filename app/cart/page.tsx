'use client';
import { useCart } from '@/components/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!cart.length) {
    return <div className="container mx-auto px-4 py-12 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Your basket</p>
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">Review & adjust items</h1>
        <p className="text-sm text-slate-500">
          {itemsCount} item{itemsCount > 1 ? 's' : ''} in cart · Eligible for secure checkout
        </p>
      </div>

      <div className="grid gap-6">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="relative h-20 w-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                <Image
                  src={item.image || '/fallback.png'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                {(item.variantLabel || item.unitLabel) && (
                  <p className="text-xs font-medium text-slate-500">
                    {item.variantLabel || item.unitLabel}
                  </p>
                )}
                <p className="text-sm text-slate-500">₹{item.price.toFixed(2)} per unit</p>
                <p className="text-sm font-medium text-emerald-600">
                  Total: ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition disabled:opacity-40"
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="mx-auto h-4 w-4" />
                </button>
                <span className="w-12 text-center text-lg font-semibold text-slate-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="mx-auto h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                className="text-slate-400 hover:text-rose-500"
                aria-label="Remove item"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
          <p className="font-semibold text-slate-700 mb-2">Need help?</p>
          <p>Chat with us for bulk orders, gift packing, or delivery assistance.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Shipping</span>
            <span className="text-emerald-600 font-medium">Free above ₹2000</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-slate-900 border-t border-slate-100 pt-4">
            <span>Grand Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={clearCart} className="w-full rounded-full">
              Clear Cart
            </Button>
            <Link href="/checkout" className="w-full">
              <Button className="w-full rounded-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-500">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/products">
          <Button variant="ghost" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
