import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { findOrderByPublicId } from '@/lib/orders/resolve';
import { formatShippingAddressForDisplay } from '@/lib/order-success-content';
import User from '@/models/User';

/** Lean user fields loaded for public order display. */
type PublicUserLean = {
  name?: string;
  email?: string;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const order = await findOrderByPublicId(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let customerName: string | undefined = order.customer?.name;
    let customerEmail: string | undefined = order.customer?.email;
    const hasAccount = Boolean(order.user);

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

    const publicData = {
      orderId: order.orderId || order._id?.toString(),
      id: order._id?.toString(),
      status: order.status,
      paidAt: order.paidAt,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      total: order.totalPrice,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount ?? 0,
      freeShippingApplied: order.freeShippingApplied ?? false,
      shippingThresholdUsed: order.shippingThresholdUsed ?? 0,
      paymentMethod: order.paymentInfo?.method,
      paymentInfo: {
        status: order.paymentInfo?.status,
        method: order.paymentInfo?.method,
        transactionId: order.paymentInfo?.transactionId,
      },
      customer: customerName || customerEmail
        ? {
            name: customerName,
            email: customerEmail,
          }
        : undefined,
      hasAccount,
      shippingAddress,
      orderItems: (order.orderItems || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        variantLabel: item.variantLabel,
        product: item.product?.toString?.() || item.product,
      })),
      items: order.orderItems,
    };

    return NextResponse.json(publicData, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching public order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
