'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from '@/lib/auth';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import { normalizeOrderItemPayload } from '@/lib/cart/identity';
import {
  decrementInventoryForOrderItems,
  validateOrderFromClient,
} from '@/lib/cart/validation.server';
import {
  claimIdempotencyKey,
  finalizeIdempotencyKey,
  releaseIdempotencyKey,
  findOrderByIdempotencyKey,
  isDuplicateKeyError,
} from '@/lib/orders/idempotency';
import crypto from 'crypto';

export async function createOrder(data: {
  name: string;
  email: string;
  phone: string;
  address: any;
  paymentMethod: string;
  items: Array<{
    id?: string;
    productId?: string;
    variantId?: string;
    variantLabel?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  idempotencyKey?: string;
}) {
  const { getSettings } = await import('@/lib/settings');
  const settings = await getSettings();
  if (!settings.paymentMethods[data.paymentMethod]) {
    throw new Error(`Payment method "${data.paymentMethod}" is currently disabled. Please select another payment method.`);
  }

  await connectToDatabase();

  const idempotencyKey = data.idempotencyKey || generateIdempotencyKey({
    items: data.items,
    total: data.total,
    email: data.email,
    phone: data.phone,
  });

  const normalizedItems = (data.items || [])
    .map((item) => normalizeOrderItemPayload(item))
    .filter(Boolean);

  const validatedOrder = await validateOrderFromClient(
    normalizedItems as any,
    data.total,
  );

  const orderItems = validatedOrder.orderItems;
  const validatedSubtotal = validatedOrder.subtotal;
  const validatedTotal = validatedOrder.total;

  const claim = await claimIdempotencyKey(idempotencyKey);
  if (claim.status === 'existing') {
    return {
      success: true,
      orderId: claim.orderId,
      id: claim.mongoId,
      fromCache: true,
    };
  }
  if (claim.status === 'pending') {
    throw new Error('Order request already in progress. Please wait and retry.');
  }

  const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  let claimHeld = true;

  try {
    if (data.paymentMethod === 'cod') {
      try {
        await decrementInventoryForOrderItems(orderItems);
      } catch (invErr: any) {
        await releaseIdempotencyKey(idempotencyKey);
        claimHeld = false;
        throw new Error(invErr?.message || 'Insufficient stock for one or more items.');
      }
    }

    const status = 'pending';
    const paymentStatus = data.paymentMethod === 'cod' ? 'pending' : 'processing';
    const session = await getServerSession();
    const shippingAddressValue = typeof data.address === 'string' ? { raw: data.address } : data.address;

    const orderPayload: any = {
      orderId,
      idempotencyKey,
      user: session?.userId || undefined,
      customer: session?.userId ? undefined : { name: data.name, email: data.email, phone: data.phone },
      shippingAddress: shippingAddressValue,
      items: orderItems,
      orderItems,
      subtotal: validatedSubtotal,
      shippingAmount: validatedOrder.shippingAmount,
      freeShippingApplied: validatedOrder.freeShippingApplied,
      shippingThresholdUsed: validatedOrder.shippingThresholdUsed,
      total: validatedTotal,
      totalPrice: validatedTotal,
      paymentMethod: data.paymentMethod,
      paymentStatus,
      paymentInfo: {
        method: data.paymentMethod,
        status: 'pending',
      },
      status,
      inventoryAdjusted: data.paymentMethod === 'cod',
    };

    let order;
    try {
      order = await Order.create(orderPayload);
    } catch (createErr) {
      if (isDuplicateKeyError(createErr)) {
        const existing = await findOrderByIdempotencyKey(idempotencyKey);
        if (existing) {
          await finalizeIdempotencyKey(idempotencyKey, existing._id.toString());
          claimHeld = false;
          return {
            success: true,
            orderId: existing.orderId || existing._id.toString(),
            id: existing._id.toString(),
            fromCache: true,
          };
        }
      }
      await releaseIdempotencyKey(idempotencyKey);
      claimHeld = false;
      throw createErr;
    }

    await finalizeIdempotencyKey(idempotencyKey, order._id.toString());
    claimHeld = false;

    return {
      success: true,
      orderId: order.orderId || orderId,
      id: order._id.toString(),
      fromCache: false,
    };
  } catch (error) {
    if (claimHeld) {
      await releaseIdempotencyKey(idempotencyKey);
    }
    throw error;
  }
}
