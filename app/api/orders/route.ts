import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from '@/lib/auth';
import crypto from 'crypto';
import { normalizeOrderItemPayload } from '@/lib/cart/identity';
import {
  decrementInventoryForOrderItems,
  incrementInventoryForOrderItem,
  validateOrderFromClient,
  type InventoryAdjustResult,
} from '@/lib/cart/validation.server';
import { verifyOrderInventoryConsistency } from '@/lib/orders/inventory-consistency';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import {
  claimIdempotencyKey,
  finalizeIdempotencyKey,
  releaseIdempotencyKey,
  findOrderByIdempotencyKey,
  isDuplicateKeyError,
} from '@/lib/orders/idempotency';

function cachedOrderResponse(existing: {
  orderId?: string;
  _id: { toString(): string };
}) {
  return NextResponse.json({
    success: true,
    orderId: existing.orderId || existing._id.toString(),
    id: existing._id.toString(),
    fromCache: true,
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orders = await Order.find({ user: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let codInventoryResults: InventoryAdjustResult[] = [];
  let effectiveIdempotencyKey: string | null = null;
  let claimHeld = false;

  try {
    const { rateLimit, getClientIdentifier } = await import('@/lib/api-rate-limiter');
    const session = await getServerSession();
    const identifier = getClientIdentifier(request as any, session?.userId);

    const rateLimitResult = await rateLimit(identifier, {
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyPrefix: 'order:create',
      critical: true,
      fallbackMaxRequests: 5,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, email, phone, address, paymentMethod, items, total, idempotencyKey } = body;

    const { getSettings } = await import('@/lib/settings');
    const settings = await getSettings();
    if (!settings.paymentMethods[paymentMethod]) {
      return NextResponse.json(
        { error: `Payment method "${paymentMethod}" is currently disabled. Please select another payment method.` },
        { status: 400 }
      );
    }

    const normalizedItems = (items || [])
      .map((item: unknown) => normalizeOrderItemPayload(item))
      .filter(Boolean);

    let validatedOrder;
    try {
      validatedOrder = await validateOrderFromClient(normalizedItems as any, total);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError?.message || 'Cart validation failed' },
        { status: 400 },
      );
    }

    const orderItems = validatedOrder.orderItems;
    const validatedSubtotal = validatedOrder.subtotal;
    const validatedTotal = validatedOrder.total;

    effectiveIdempotencyKey =
      idempotencyKey ||
      generateIdempotencyKey({
        items: normalizedItems.map((item: any) => ({
          id: item.productId || item.id || '',
          quantity: item.quantity || 0,
        })),
        total: validatedTotal,
        email,
        phone,
      });

    const claim = await claimIdempotencyKey(effectiveIdempotencyKey);
    if (claim.status === 'existing') {
      const existingOrder = await Order.findById(claim.mongoId);
      if (existingOrder) {
        return cachedOrderResponse(existingOrder);
      }
    }
    if (claim.status === 'pending') {
      return NextResponse.json(
        { error: 'Order request already in progress. Please retry shortly.' },
        {
          status: 409,
          headers: {
            'Retry-After': String(claim.retryAfterSeconds),
          },
        },
      );
    }

    claimHeld = true;
    const merchantOrderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    if (paymentMethod === 'cod') {
      try {
        codInventoryResults = await decrementInventoryForOrderItems(orderItems);
      } catch (invErr: any) {
        console.error('[orders][create] COD inventory decrement failed', invErr);
        await releaseIdempotencyKey(effectiveIdempotencyKey);
        claimHeld = false;
        return NextResponse.json(
          { error: invErr?.message || 'Insufficient stock for one or more items.' },
          { status: 409 },
        );
      }
    }

    const status = 'pending';
    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'processing';
    const paymentInfoStatus = 'pending';
    const shippingAddressValue = typeof address === 'string' ? { raw: address } : address;

    const orderPayload: any = {
      orderId: merchantOrderId,
      idempotencyKey: effectiveIdempotencyKey,
      user: session?.userId || undefined,
      customer: session?.userId ? undefined : { name, email, phone },
      shippingAddress: shippingAddressValue,
      items: orderItems,
      orderItems,
      subtotal: validatedSubtotal,
      shippingAmount: validatedOrder.shippingAmount,
      freeShippingApplied: validatedOrder.freeShippingApplied,
      shippingThresholdUsed: validatedOrder.shippingThresholdUsed,
      total: validatedTotal,
      totalPrice: validatedTotal,
      paymentMethod,
      paymentStatus,
      paymentInfo: {
        method: paymentMethod,
        status: paymentInfoStatus,
      },
      status,
      inventoryAdjusted: paymentMethod === 'cod',
    };

    let order;
    try {
      order = await Order.create(orderPayload);
    } catch (createErr) {
      if (paymentMethod === 'cod' && codInventoryResults.length) {
        for (const result of codInventoryResults) {
          const restoredQty = result.previousQty - result.updatedQty;
          if (restoredQty > 0) {
            await incrementInventoryForOrderItem(
              result.productDoc._id.toString(),
              restoredQty,
            );
          }
        }
      }

      if (isDuplicateKeyError(createErr) && effectiveIdempotencyKey) {
        const existing = await findOrderByIdempotencyKey(effectiveIdempotencyKey);
        if (existing) {
          await finalizeIdempotencyKey(effectiveIdempotencyKey, existing._id.toString());
          claimHeld = false;
          return cachedOrderResponse(existing);
        }
      }

      await releaseIdempotencyKey(effectiveIdempotencyKey);
      claimHeld = false;
      throw createErr;
    }

    await finalizeIdempotencyKey(effectiveIdempotencyKey, order._id.toString());
    claimHeld = false;

    console.info('[orders][create] created order', {
      orderId: order.orderId,
      _id: order._id,
      user: order.user,
      customer: order.customer,
      paymentMethod,
    });

    if (paymentMethod === 'cod') {
      const consistency = verifyOrderInventoryConsistency(order.toObject?.() ?? order);
      if (!consistency.valid) {
        console.error('[orders][create] COD inventory consistency issue', {
          orderId: order._id,
          issues: consistency.issues,
        });
      }
    }

    try {
      const {
        sendOrderConfirmationEmail,
        sendAdminOrderNotification,
        sendLowInventoryAlert,
      } = await import('@/lib/email-service');

      await sendOrderConfirmationEmail({
        email,
        orderId: merchantOrderId,
        total: validatedTotal,
        paymentMethod,
        address: typeof address === 'string' ? address : JSON.stringify(address),
        items: orderItems.map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 0,
          price: item.price || 0,
        })),
      });

      await sendAdminOrderNotification({
        orderId: merchantOrderId,
        name,
        email,
        phone,
        total: validatedTotal,
        paymentMethod,
        address: typeof address === 'string' ? address : JSON.stringify(address),
      });

      if (paymentMethod === 'cod') {
        for (const result of codInventoryResults) {
          if (
            result.updatedQty != null &&
            result.updatedQty <= 10 &&
            result.previousQty > 10
          ) {
            await sendLowInventoryAlert({
              productName: result.productDoc.name || 'Unknown Product',
              productId: result.productDoc._id.toString(),
              currentQuantity: result.updatedQty,
              threshold: 10,
            });
          }
        }
      }
    } catch (emailErr) {
      console.error('Error sending notification emails:', emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.orderId || merchantOrderId,
        id: order._id,
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        },
      }
    );
  } catch (error) {
    if (claimHeld && effectiveIdempotencyKey) {
      await releaseIdempotencyKey(effectiveIdempotencyKey);
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
}
