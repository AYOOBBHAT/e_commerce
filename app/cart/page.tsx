'use client';

import { useMemo } from 'react';
import { useCart } from '@/components/CartProvider';
import CartStickyBar from '@/components/cart/CartStickyBar';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useStorefrontSettings } from '@/components/StorefrontSettingsProvider';
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/constants';
import { getShippingDisplay } from '@/lib/shipping';

function formatInr(value: number) {
  return value.toLocaleString('en-IN');
}

function CartEmptyState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] px-4 py-12">
      <div className="max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm shadow-stone-900/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
          Your cart
        </p>
        <h1 className="mt-2 text-xl font-bold text-stone-900 sm:text-2xl">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Explore our Kashmir collection — farm-fresh staples, handmade treats, and
          wellness picks.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="rounded-full bg-stone-900 text-white hover:bg-stone-800"
          >
            <Link href="/products">Browse Products</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-stone-200 bg-white text-stone-900 hover:bg-stone-50"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CartSummary({
  subtotal,
  checkoutBlocked,
}: {
  subtotal: number;
  checkoutBlocked: boolean;
}) {
  const { shipping } = useStorefrontSettings();
  const quote = useMemo(
    () => getShippingDisplay(subtotal, shipping),
    [subtotal, shipping],
  );

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm shadow-stone-900/[0.03]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
        Order summary
      </h2>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span className="font-medium text-stone-900">₹{formatInr(subtotal)}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Shipping</span>
          <span
            className={
              quote.freeShippingApplied
                ? 'font-medium text-[#B87333]'
                : 'font-medium text-stone-900'
            }
          >
            {quote.shippingLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
        <span className="text-base font-semibold text-stone-900">Total</span>
        <span className="text-xl font-bold text-stone-900">₹{formatInr(quote.orderTotal)}</span>
      </div>

      {checkoutBlocked ? (
        <Button
          disabled
          className="mt-4 h-12 w-full rounded-full bg-stone-900 text-base font-semibold text-white opacity-50"
        >
          Proceed to Checkout
        </Button>
      ) : (
        <Link href="/checkout" className="mt-4 block w-full">
          <Button className="h-12 w-full rounded-full bg-stone-900 text-base font-semibold text-white hover:bg-stone-800">
            Proceed to Checkout
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
    updateQuantity,
    cartReady,
    checkoutBlocked,
    removedItemsNotice,
    itemsMeta,
  } = useCart();
  const { shipping } = useStorefrontSettings();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quote = useMemo(
    () => getShippingDisplay(subtotal, shipping),
    [subtotal, shipping],
  );
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!cartReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] px-4">
        <p className="text-sm text-stone-600">Loading cart…</p>
      </div>
    );
  }

  if (!cart.length) {
    return <CartEmptyState />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 md:pb-12">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            Your cart
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-stone-900 sm:text-3xl">
            Review &amp; adjust items
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} · Secure checkout
          </p>
        </header>

        {removedItemsNotice && (
          <p
            className="mb-6 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-600"
            role="status"
          >
            {removedItemsNotice}
          </p>
        )}

        {checkoutBlocked && (
          <p
            className="mb-6 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-600"
            role="status"
          >
            Resolve unavailable items before checkout.
          </p>
        )}

        <div className="grid gap-6">
          {cart.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/[0.03] sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-[#FAF7F2]">
                  <Image
                    src={item.image?.trim() ? item.image : PRODUCT_FALLBACK_IMAGE}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="line-clamp-2 text-base font-semibold text-stone-900">
                    {item.name}
                  </h2>
                  {(item.variantLabel || item.unitLabel) && (
                    <p className="text-xs font-medium text-stone-500">
                      {item.variantLabel || item.unitLabel}
                    </p>
                  )}
                  <p className="text-sm text-stone-500">
                    ₹{formatInr(item.price)} per unit
                  </p>
                  <p className="text-sm font-medium text-stone-900">
                    Line total: ₹{formatInr(item.price * item.quantity)}
                  </p>
                  {itemsMeta[item.id]?.priceUpdated && (
                    <p className="text-xs font-medium text-[#B87333]">Price updated</p>
                  )}
                  {itemsMeta[item.id]?.unavailable && (
                    <p className="text-xs text-stone-600">
                      This item is currently unavailable
                    </p>
                  )}
                  {itemsMeta[item.id]?.quantityAdjusted &&
                    itemsMeta[item.id]?.message &&
                    !itemsMeta[item.id]?.unavailable && (
                      <p className="text-xs text-stone-600">{itemsMeta[item.id]?.message}</p>
                    )}
                </div>
              </div>

              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                <div className="inline-flex items-center rounded-full border border-stone-200 bg-[#FAF7F2] px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-white disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-semibold text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-white"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="text-stone-400 hover:text-stone-900"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-4 text-sm md:hidden">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal ({itemsCount} items)</span>
            <span className="font-semibold text-stone-900">₹{formatInr(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-stone-600">
            <span>Shipping</span>
            <span
              className={
                quote.freeShippingApplied
                  ? 'font-semibold text-[#B87333]'
                  : 'font-semibold text-stone-900'
              }
            >
              {quote.shippingLabel}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-stone-100 pt-2 font-semibold text-stone-900">
            <span>Total</span>
            <span>₹{formatInr(quote.orderTotal)}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 text-sm text-stone-600 shadow-sm shadow-stone-900/[0.03]">
              <p className="font-semibold text-stone-900">Need help?</p>
              <p className="mt-2 leading-relaxed">
                Contact us for bulk orders, gift packing, or delivery assistance.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
                >
                  Clear cart
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-stone-200 bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-stone-900">
                    Clear your cart?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-stone-600">
                    All {itemsCount} item{itemsCount === 1 ? '' : 's'} will be removed. This
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full border-stone-200">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearCart}
                    className="rounded-full bg-stone-900 text-white hover:bg-stone-800"
                  >
                    Clear cart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="hidden md:block">
            <CartSummary subtotal={subtotal} checkoutBlocked={checkoutBlocked} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="text-sm font-semibold text-[#B87333] hover:text-stone-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <CartStickyBar
        itemsCount={itemsCount}
        orderTotal={quote.orderTotal}
        checkoutBlocked={checkoutBlocked}
      />
    </div>
  );
}
