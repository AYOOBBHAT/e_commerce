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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Your Cart</h1>
      <div className="flex flex-col gap-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b pb-4">
            <Image src={item.image} alt={item.name} width={80} height={80} className="rounded border" />
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-muted-foreground text-sm">₹{item.price.toFixed(2)} x {item.quantity}</div>
            </div>
            <Button variant="destructive" onClick={() => removeFromCart(item.id)}>Remove</Button>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-8">
  <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
        <Button variant="secondary" onClick={clearCart}>Clear Cart</Button>
        <Link href="/checkout">
          <Button variant="default">Checkout</Button>
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
