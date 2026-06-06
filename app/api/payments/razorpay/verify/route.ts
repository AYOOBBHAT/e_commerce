import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
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

    // Signature valid — finalize order. If merchantOrderId not provided try to locate by payment or order mapping
    await connectToDatabase();

    let order = null as any;
    if (merchantOrderId) {
      order = await Order.findById(String(merchantOrderId));
    }

    if (!order) {
      // Try find by stored razorpayOrderId mapping
      order = await Order.findOne({ 'paymentInfo.razorpayOrderId': String(razorpayOrderId) });
    }

    if (!order) {
      // Fallback: try by payment id
      order = await Order.findOne({ 'paymentInfo.transactionId': String(razorpayPaymentId) });
    }

    // If we still don't have order, create a minimal audit log entry and return success
    if (!order) {
      console.warn('[razorpay][verify] could not find internal order for razorpay ids', { razorpayOrderId, razorpayPaymentId });
      return NextResponse.json({ success: true, note: 'No matching order in DB' });
    }

    // Attach payment info and call shared finalizer
    order.paymentInfo = order.paymentInfo || {};
    order.paymentInfo.method = 'razorpay';
    order.paymentInfo.transactionId = String(razorpayPaymentId);
    order.paymentInfo.razorpayOrderId = String(razorpayOrderId);
    await order.save();

    await finalizeOrder({ provider: 'razorpay', merchantOrderId: String(order._id), txId: String(razorpayPaymentId), state: 'CAPTURED', providerResponse: body });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[razorpay][verify] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
