import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { parseRazorpayVerifyPayload } from '@/lib/payments/validation';
import type { HydratedDocument } from 'mongoose';
import type { IOrder } from '@/models/Order';

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit(req, {
      windowMs: 60 * 1000,
      maxRequests: 20,
      keyPrefix: 'payments:razorpay:verify',
      limitHeader: '20',
      critical: true,
      fallbackMaxRequests: 5,
    });
    if (limited) return limited;

    const rawBody: unknown = await req.json();
    const parsed = parseRazorpayVerifyPayload(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { merchantOrderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      parsed.value;

    if (!KEY_SECRET) {
      console.warn('[razorpay][verify] missing KEY_SECRET - cannot verify signature');
      return NextResponse.json({ error: 'Server verification not configured' }, { status: 500 });
    }

    const generated = crypto
      .createHmac('sha256', String(KEY_SECRET))
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (generated !== razorpaySignature) {
      console.warn('[razorpay][verify] signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectToDatabase();

    let order: HydratedDocument<IOrder> | null = null;
    if (merchantOrderId) {
      order = await Order.findById(merchantOrderId);
    }

    if (!order) {
      order = await Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });
    }

    if (!order) {
      order = await Order.findOne({ 'paymentInfo.transactionId': razorpayPaymentId });
    }

    if (!order) {
      console.warn('[razorpay][verify] could not find internal order for razorpay ids', {
        razorpayOrderId,
        razorpayPaymentId,
      });
      return NextResponse.json({ error: 'Order not found for this payment' }, { status: 404 });
    }

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'paymentInfo.method': 'razorpay',
        'paymentInfo.razorpayOrderId': razorpayOrderId,
      },
    });

    const result = await finalizeOrder({
      provider: 'razorpay',
      merchantOrderId: order._id.toString(),
      txId: razorpayPaymentId,
      state: 'CAPTURED',
      providerResponse: rawBody,
    });

    if (!result.ok) {
      if (result.inventoryError) {
        return NextResponse.json(
          { error: result.inventoryError, code: 'INVENTORY_UNAVAILABLE' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: result.error || 'Failed to finalize order' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, idempotent: result.idempotent === true });
  } catch (err: unknown) {
    console.error('[razorpay][verify] error', getErrorMessage(err, 'Internal error'));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
