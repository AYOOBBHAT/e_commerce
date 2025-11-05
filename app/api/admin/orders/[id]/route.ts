import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Audit from '@/models/Audit';
import { getServerSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const order = await Order.findById(params.id)
      .populate('user', 'name email')
      .populate('orderItems.product');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const data = await request.json();
    // Only allow updating status and paymentInfo.status via admin
    const update: any = {};
    if (typeof data.status === 'string') update.status = data.status;
    if (data.paymentInfo && typeof data.paymentInfo.status === 'string') update['paymentInfo.status'] = data.paymentInfo.status;

    // fetch current order to capture previous status
    const existing = await Order.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const prevStatus = existing.status;

    const order = await Order.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true }
    );
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // create audit log entry for status change
    try {
      if (update.status && update.status !== prevStatus) {
        await Audit.create({
          adminId: session.userId,
          orderId: params.id,
          action: 'update_order_status',
          before: prevStatus,
          after: update.status,
        });
      }
    } catch (auditErr) {
      console.warn('Failed to create audit log:', auditErr);
    }

    // include previous status in response to allow client-side undo
    return NextResponse.json({ order, previousStatus: prevStatus });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}