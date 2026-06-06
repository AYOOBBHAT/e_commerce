import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const orderId = params.id;
    const order = (await Order.findById(orderId).lean()) as any;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Return only minimal public information so we can poll status on redirect pages
    const publicData = {
      orderId: order.orderId,
      id: order._id,
      status: order.status,
      paidAt: order.paidAt,
      orderNumber: order.orderNumber,
      paymentInfo: {
        status: order.paymentInfo?.status,
        transactionId: order.paymentInfo?.transactionId,
      },
    };

    return NextResponse.json(publicData, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching public order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
