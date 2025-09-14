'use client';
import { useCart } from '@/components/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!cart.length) {
    return <div className="container mx-auto px-4 py-12 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Your Cart</h1>
      <div className="flex flex-col gap-4 sm:gap-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-4 bg-card rounded-lg shadow-sm border">
            <Image src={item.image} alt={item.name} width={60} height={60} className="sm:w-20 sm:h-20 rounded-lg border object-cover flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm sm:text-base mb-1">{item.name}</div>
              <div className="text-muted-foreground text-sm">₹{item.price.toFixed(2)} × {item.quantity}</div>
              <div className="font-semibold text-primary mt-1">₹{(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)} className="flex-shrink-0">
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-8 sm:mt-12 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-muted/50 rounded-lg">
          <div className="text-xl sm:text-2xl font-bold">Total: ₹{total.toFixed(2)}</div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={clearCart} className="w-full sm:w-auto">
              Clear Cart
            </Button>
            <Link href="/checkout" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:w-auto">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <Link href="/products">
          <Button variant="outline" size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
