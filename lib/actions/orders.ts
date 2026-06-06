'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';
import { generateIdempotencyKey } from '@/lib/utils/idempotency';
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
    id: string;
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

  // Prepare order items
  const orderItems: any[] = [];
  for (const item of data.items || []) {
    let productId = null;
    if (item?.id) {
      const productDoc = await Product.findById(item.id);
      if (productDoc) {
        productId = productDoc._id;

        // Only reduce stock immediately for COD orders
        if (data.paymentMethod === 'cod') {
          const currentQty = typeof productDoc.quantity === 'number' ? productDoc.quantity : 0;
          const updatedQty = Math.max(0, currentQty - (item.quantity || 0));
          productDoc.quantity = updatedQty;
          productDoc.inStock = updatedQty > 0;
          await productDoc.save();
        }
      }
    }

    const orderItem: any = {
      name: item.name || '',
      image: item.image || '',
      price: item.price || 0,
      quantity: item.quantity || 0,
    };
    if (productId) orderItem.product = productId;

    orderItems.push(orderItem);
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
    total: data.total,
    totalPrice: data.total,
    paymentMethod: data.paymentMethod,
    paymentStatus,
    paymentInfo: {
      method: data.paymentMethod,
      status: 'pending',
    },
    status,
  };

  const order = await Order.create(orderPayload);
  
  // Store idempotency key
  await storeIdempotency(idempotencyKey, order._id.toString());

  return {
    success: true,
    orderId: order.orderId,
    id: order._id.toString(),
    fromCache: false,
  };
}

