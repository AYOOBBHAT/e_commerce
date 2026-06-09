import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { findOrderByPublicId } from '@/lib/orders/resolve';
import { formatShippingAddressForDisplay } from '@/lib/order-success-content';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import User from '@/models/User';
import type { IOrderItem } from '@/models/Order';

/** Lean user fields loaded for public order display. */
type PublicUserLean = {
  name?: string;
  email?: string;
};

type PublicOrderItem = {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variantLabel?: string;
  product?: string;
};

const toPublicOrderItem = (item: IOrderItem): PublicOrderItem => ({
  name: item.name,
  quantity: item.quantity,
  price: item.price,
  image: item.image,
  variantLabel: item.variantLabel,
  product: item.product != null ? item.product.toString() : undefined,
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const limited = await enforceApiRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 60,
      keyPrefix: 'orders:public:get',
      limitHeader: '60',
      critical: true,
      fallbackMaxRequests: 30,
    });
    if (limited) return limited;

    await connectToDatabase();
    const order = await findOrderByPublicId(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let customerName: string | undefined = order.customer?.name;
    let customerEmail: string | undefined = order.customer?.email;

    if (order.user) {
      try {
        const userDoc = await User.findById(order.user)
          .select('name email')
          .lean<PublicUserLean>();
        if (userDoc) {
          customerName = userDoc.name || customerName;
          customerEmail = userDoc.email || customerEmail;
        }
      } catch (lookupErr) {
        console.warn('[orders][public] user lookup failed', lookupErr);
      }
    }

    const shippingAddress = formatShippingAddressForDisplay(order.shippingAddress);
    const orderLineItems: IOrderItem[] = order.orderItems ?? [];
    const paymentMethod = order.paymentInfo?.method;

    const publicData = {
      orderId: order.orderId || order._id?.toString(),
      totalPrice: order.totalPrice,
      total: order.totalPrice,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount ?? 0,
      freeShippingApplied: order.freeShippingApplied ?? false,
      paymentMethod,
      paymentInfo: {
        status: order.paymentInfo?.status,
        method: paymentMethod,
      },
      customer: customerName || customerEmail
        ? {
            name: customerName,
            email: customerEmail,
          }
        : undefined,
      shippingAddress,
      orderItems: orderLineItems.map(toPublicOrderItem),
    };

    return NextResponse.json(publicData, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching public order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
