import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Audit from '@/models/Audit';
import { getServerSession } from '@/lib/auth';
import { findOrderByPublicId } from '@/lib/orders/resolve';
import { restoreInventoryForOrder } from '@/lib/orders/inventory-restore';
import { validateOrderStatusTransition } from '@/lib/orders/status-transitions';

async function loadAdminOrder(id: string) {
  const order = await findOrderByPublicId(id);
  if (!order) return null;
  return Order.findById(order._id)
    .populate('user', 'name email')
    .populate('orderItems.product');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const order = await loadAdminOrder(params.id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const data = await request.json();

    const existing = await findOrderByPublicId(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderMongoId = existing._id.toString();
    const prevStatus = existing.status;

    const update: Record<string, unknown> = {};
    if (typeof data.status === 'string') {
      const transition = validateOrderStatusTransition(prevStatus, data.status);
      if (!transition.allowed) {
        return NextResponse.json({ error: transition.error }, { status: 400 });
      }
      update.status = data.status;
    }

    if (data.paymentInfo && typeof data.paymentInfo.status === 'string') {
      update['paymentInfo.status'] = data.paymentInfo.status;
    }

    const isCancelling =
      update.status === 'cancelled' && prevStatus !== 'cancelled';
    const shouldRestoreInventory = isCancelling && existing.inventoryAdjusted;

    const order = await Order.findByIdAndUpdate(
      orderMongoId,
      { $set: update },
      { new: true },
    )
      .populate('user', 'name email')
      .populate('orderItems.product');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (shouldRestoreInventory) {
      try {
        await restoreInventoryForOrder(order);
        await Order.findByIdAndUpdate(orderMongoId, {
          $set: { inventoryAdjusted: false },
        });
        order.inventoryAdjusted = false;
      } catch (invErr) {
        console.error('[admin][orders] inventory restore on cancel failed', invErr);
        return NextResponse.json(
          {
            error:
              'Order was cancelled but inventory could not be restored. Check stock manually.',
          },
          { status: 500 },
        );
      }
    }

    try {
      if (update.status && update.status !== prevStatus) {
        await Audit.create({
          adminId: session.userId,
          orderId: orderMongoId,
          action: 'update_order_status',
          before: prevStatus,
          after: update.status,
        });
      }
    } catch (auditErr) {
      console.warn('Failed to create audit log:', auditErr);
    }

    if (update.status === 'shipped' && update.status !== prevStatus) {
      try {
        const { sendShippingUpdateEmail } = await import('@/lib/email-service');

        let customerEmail: string | null = null;
        const populatedOrder = await Order.findById(orderMongoId).populate(
          'user',
          'email name',
        );
        if (populatedOrder?.user) {
          customerEmail = (populatedOrder.user as { email?: string }).email || null;
        }
        if (!customerEmail && populatedOrder?.customer?.email) {
          customerEmail = populatedOrder.customer.email;
        }

        if (customerEmail) {
          await sendShippingUpdateEmail({
            email: customerEmail,
            orderId: order.orderId || orderMongoId,
            trackingNumber: data.trackingNumber,
          });
        }
      } catch (emailErr) {
        console.error('Error sending shipping notification:', emailErr);
      }
    }

    return NextResponse.json({ order, previousStatus: prevStatus });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
