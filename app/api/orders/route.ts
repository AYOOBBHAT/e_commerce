import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all orders for the logged-in user
    const orders = await Order.find({ user: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (10 orders per minute per user/IP)
    const { rateLimit, getClientIdentifier } = await import('@/lib/api-rate-limiter');
    const session = await getServerSession();
    const identifier = getClientIdentifier(request as any, session?.userId);
    
    const rateLimitResult = await rateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyPrefix: 'order:create',
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

    // Validate payment method is enabled
    const { getSettings } = await import('@/lib/settings');
    const settings = await getSettings();
    if (!settings.paymentMethods[paymentMethod]) {
      return NextResponse.json(
        { error: `Payment method "${paymentMethod}" is currently disabled. Please select another payment method.` },
        { status: 400 }
      );
    }

    // Use idempotency if provided
    if (idempotencyKey) {
      const { checkIdempotency } = await import('@/lib/actions/orders');
      const existingOrderId = await checkIdempotency(idempotencyKey);
      if (existingOrderId) {
        const existingOrder = await Order.findById(existingOrderId);
        if (existingOrder) {
          return NextResponse.json({
            success: true,
            orderId: existingOrder.orderId,
            id: existingOrder._id.toString(),
            fromCache: true,
          });
        }
      }
    }

    // Generate unique order ID
    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Prepare order items. For online payments we DO NOT finalize inventory here (finalize upon webhook confirmation).
    const orderItems: any[] = [];
    for (const item of items || []) {
      // If item has product id, try to fetch product document. Otherwise include it as-is (guest items)
      let productId = null;
      if (item?.id) {
        const productDoc = await Product.findById(item.id);
        if (productDoc) {
          productId = productDoc._id;

          // Only reduce stock immediately for COD orders to avoid holding inventory for unpaid online orders
          if (paymentMethod === 'cod') {
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

    // Set initial status and payment
    const status = 'pending';
    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'processing';

    // Create order
    const paymentInfoStatus = 'pending';

    // Attach authenticated user if present, otherwise store guest contact information
    const shippingAddressValue = typeof address === 'string' ? { raw: address } : address;

    const orderPayload: any = {
      orderId,
      user: session?.userId || undefined,
      customer: session?.userId ? undefined : { name, email, phone },
      shippingAddress: shippingAddressValue,
      items: orderItems,
      orderItems,
      total,
      totalPrice: total,
      paymentMethod,
      paymentStatus,
      paymentInfo: {
        method: paymentMethod,
        status: paymentInfoStatus,
      },
      status,
    };

    const order = await Order.create(orderPayload);
    console.info('[orders][create] created order', { orderId: order.orderId, _id: order._id, user: order.user, customer: order.customer });

    // Store idempotency key if provided
    if (idempotencyKey) {
      const { storeIdempotency } = await import('@/lib/actions/orders');
      await storeIdempotency(idempotencyKey, order._id.toString());
    }

    // Send order confirmation emails (best-effort, don't fail order if email fails)
    try {
      const {
        sendOrderConfirmationEmail,
        sendAdminOrderNotification,
        sendLowInventoryAlert,
      } = await import('@/lib/email-service');

      // Send customer confirmation email
      await sendOrderConfirmationEmail({
        email,
        orderId,
        total,
        paymentMethod,
        address: typeof address === 'string' ? address : JSON.stringify(address),
        items: items?.map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 0,
          price: item.price || 0,
        })),
        });

      // Send admin notification
      await sendAdminOrderNotification({
        orderId,
        name,
        email,
        phone,
        total,
        paymentMethod,
        address: typeof address === 'string' ? address : JSON.stringify(address),
      });

      // Check for low inventory and send alerts
      for (const item of items || []) {
        if (item?.id) {
          const productDoc = await Product.findById(item.id);
          if (productDoc && productDoc.quantity <= 10) {
            await sendLowInventoryAlert({
              productName: productDoc.name || 'Unknown Product',
              productId: productDoc._id.toString(),
              currentQuantity: productDoc.quantity || 0,
              threshold: 10,
            });
          }
        }
      }
      } catch (emailErr) {
        console.error('Error sending notification emails:', emailErr);
        // Don't fail the order if email fails
    }

    // TODO: Log transaction for audit

    // If this POST includes Razorpay callback fields, verify the signature server-side and finalize payment
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body as any;
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      try {
        // Verify signature using Razorpay secret
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error('Missing RAZORPAY_KEY_SECRET in env');
        const crypto = require('crypto');
        const generated = crypto.createHmac('sha256', String(secret)).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
        if (generated !== String(razorpaySignature)) {
          console.warn('[orders][create] razorpay signature verification failed');
          return NextResponse.json({ error: 'Invalid Razorpay signature' }, { status: 400 });
        }

        // Mark order as paid
        order.paymentInfo = order.paymentInfo || {};
        order.paymentInfo.method = 'razorpay';
        order.paymentInfo.transactionId = razorpayPaymentId;
        order.paymentInfo.status = 'completed';
        order.paidAt = new Date();
        order.status = 'confirmed';
        order.inventoryAdjusted = false; // will adjust below

        // Adjust inventory for each item (idempotent-ish)
        const Product = require('@/models/Product').default;
        const { sendLowInventoryAlert } = await import('@/lib/email-service');
        
        for (const it of order.orderItems || order.items || []) {
          if (it?.product) {
            try {
              const p = await Product.findById(it.product);
              if (p && typeof p.quantity === 'number') {
                const oldQty = p.quantity;
                const newQty = Math.max(0, p.quantity - (it.quantity || 0));
                p.quantity = newQty;
                p.inStock = newQty > 0;
                await p.save();

                // Check for low inventory alert
                if (newQty <= 10 && oldQty > 10) {
                  await sendLowInventoryAlert({
                    productName: p.name || 'Unknown Product',
                    productId: p._id.toString(),
                    currentQuantity: newQty,
                    threshold: 10,
                  });
                }
              }
            } catch (e) {
              console.warn('Error adjusting inventory for product', it.product, e);
            }
          }
        }

        order.inventoryAdjusted = true;
        await order.save();

        console.info('[orders][create] order finalized after Razorpay payment', { _id: order._id, orderId: order.orderId });
        return NextResponse.json({ success: true, orderId: order.orderId, id: order._id });
      } catch (sigErr) {
        console.error('[orders][create] error finalizing razorpay payment', sigErr);
        return NextResponse.json({ error: 'Failed to verify/complete Razorpay payment' }, { status: 500 });
      }
    }

    // Return both merchant-visible orderId and internal database id (_id)
    return NextResponse.json(
      { success: true, orderId: order.orderId, id: order._id },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
}
