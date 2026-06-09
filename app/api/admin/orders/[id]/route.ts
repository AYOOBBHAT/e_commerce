import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Audit from '@/models/Audit';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { findOrderByPublicId } from '@/lib/orders/resolve';
import { restoreInventoryWithClaim } from '@/lib/orders/inventory-restore';
import { validateOrderStatusTransition } from '@/lib/orders/status-transitions';
import { parseAdminOrderPatchBody } from '@/lib/admin/order-patch';

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
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
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
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    await connectToDatabase();
    const rawBody: unknown = await request.json();
    const parsed = parseAdminOrderPatchBody(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.value;

    const existing = await findOrderByPublicId(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderMongoId = existing._id.toString();
    const prevStatus = existing.status;

    const update: Record<string, unknown> = {};
    if (data.status) {
      const transition = validateOrderStatusTransition(prevStatus, data.status);
      if (!transition.allowed) {
        return NextResponse.json({ error: transition.error }, { status: 400 });
      }
      update.status = data.status;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Only order status can be changed.' },
        { status: 400 },
      );
    }

    const isCancelling =
      update.status === 'cancelled' && prevStatus !== 'cancelled';

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

    if (isCancelling) {
      try {
        const restoreOutcome = await restoreInventoryWithClaim(orderMongoId, {
          orderId: orderMongoId,
          source: 'admin_cancel',
        });

        if (restoreOutcome === 'in_progress') {
          return NextResponse.json(
            {
              error:
                'Inventory restore is already in progress for this order. Retry shortly.',
            },
            { status: 409 },
          );
        }
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

    const responseOrder = isCancelling
      ? await Order.findById(orderMongoId)
          .populate('user', 'name email')
          .populate('orderItems.product')
      : order;

    if (!responseOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    try {
      if (update.status && update.status !== prevStatus) {
        await Audit.create({
          adminId: auth.adminId,
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
            orderId: responseOrder.orderId || orderMongoId,
            trackingNumber: data.trackingNumber,
          });
        }
      } catch (emailErr) {
        console.error('Error sending shipping notification:', emailErr);
      }
    }

    return NextResponse.json({ order: responseOrder, previousStatus: prevStatus });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
