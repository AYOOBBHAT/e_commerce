import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';

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

    const body = await req.json();
    const { merchantOrderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body as any;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!KEY_SECRET) {
      console.warn('[razorpay][verify] missing KEY_SECRET - cannot verify signature');
      return NextResponse.json({ error: 'Server verification not configured' }, { status: 500 });
    }

    const generated = crypto.createHmac('sha256', String(KEY_SECRET)).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (generated !== String(razorpaySignature)) {
      console.warn('[razorpay][verify] signature mismatch', { generated, signature: razorpaySignature });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectToDatabase();

    let order = null as any;
    if (merchantOrderId) {
      order = await Order.findById(String(merchantOrderId));
    }

    if (!order) {
      order = await Order.findOne({ 'paymentInfo.razorpayOrderId': String(razorpayOrderId) });
    }

    if (!order) {
      order = await Order.findOne({ 'paymentInfo.transactionId': String(razorpayPaymentId) });
    }

    if (!order) {
      console.warn('[razorpay][verify] could not find internal order for razorpay ids', { razorpayOrderId, razorpayPaymentId });
      return NextResponse.json({ error: 'Order not found for this payment' }, { status: 404 });
    }

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'paymentInfo.method': 'razorpay',
        'paymentInfo.razorpayOrderId': String(razorpayOrderId),
      },
    });

    const result = await finalizeOrder({
      provider: 'razorpay',
      merchantOrderId: String(order._id),
      txId: String(razorpayPaymentId),
      state: 'CAPTURED',
      providerResponse: body,
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
  } catch (err: any) {
    console.error('[razorpay][verify] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
