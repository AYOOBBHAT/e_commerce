'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
import { normalizeOrderItemPayload } from '@/lib/cart/identity';
import {
  decrementInventoryForOrderItems,
  validateOrderFromClient,
} from '@/lib/cart/validation.server';
import crypto from 'crypto';

// Idempotency helper - prevents duplicate orders
export async function checkIdempotency(idempotencyKey: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const existingRaw = await redis.get(`idempotency:order:${idempotencyKey}`);
    const existing = typeof existingRaw === 'string' ? existingRaw : null;
    if (existing) {
      return existing; // Return existing order ID
    }
  } catch (error) {
    console.error('[Orders] Idempotency check error:', error);
  }

  return null;
}

export async function storeIdempotency(idempotencyKey: string, orderId: string, ttl: number = 3600): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Use set with ex option for expiration (Upstash Redis REST API)
    await redis.set(`idempotency:order:${idempotencyKey}`, orderId, { ex: ttl });
  } catch (error) {
    console.error('[Orders] Idempotency store error:', error);
  }
}

// Create order with idempotency
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
  // Validate payment method is enabled (before any database operations)
  const { getSettings } = await import('@/lib/settings');
  const settings = await getSettings();
  if (!settings.paymentMethods[data.paymentMethod]) {
    throw new Error(`Payment method "${data.paymentMethod}" is currently disabled. Please select another payment method.`);
  }

  await connectToDatabase();

  // Generate idempotency key if not provided
  const idempotencyKey = data.idempotencyKey || generateIdempotencyKey({
    items: data.items,
    total: data.total,
    email: data.email,
    phone: data.phone,
  });

  // Check if this request was already processed
  const existingOrderId = await checkIdempotency(idempotencyKey);
  if (existingOrderId) {
    const existingOrder = await Order.findById(existingOrderId);
    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder.orderId,
        id: existingOrder._id.toString(),
        fromCache: true,
      };
    }
  }

  // Generate unique order ID
  const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const normalizedItems = (data.items || [])
    .map((item) => normalizeOrderItemPayload(item))
    .filter(Boolean);

  const validatedOrder = await validateOrderFromClient(
    normalizedItems as any,
    data.total,
  );

  const orderItems = validatedOrder.orderItems;
  const validatedTotal = validatedOrder.total;

  if (data.paymentMethod === 'cod') {
    try {
      await decrementInventoryForOrderItems(orderItems);
    } catch (invErr: any) {
      throw new Error(invErr?.message || 'Insufficient stock for one or more items.');
    }
  }

  const status = 'pending';
  const paymentStatus = data.paymentMethod === 'cod' ? 'pending' : 'processing';
  const session = await getServerSession();
  const shippingAddressValue = typeof data.address === 'string' ? { raw: data.address } : data.address;

  const orderPayload: any = {
    orderId,
    user: session?.userId || undefined,
    customer: session?.userId ? undefined : { name: data.name, email: data.email, phone: data.phone },
    shippingAddress: shippingAddressValue,
    items: orderItems,
    orderItems,
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

  const order = await Order.create(orderPayload);
  
  // Store idempotency key
  await storeIdempotency(idempotencyKey, order._id.toString());

  return {
    success: true,
    orderId: order.orderId || orderId,
    id: order._id.toString(),
    fromCache: false,
  };
}

