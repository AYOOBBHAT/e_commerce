import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { finalizeOrder } from '@/lib/finalizePayment';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    const headerSig = request.headers.get('x-razorpay-signature') || request.headers.get('x-razorpay-signature');

    if (!headerSig || !WEBHOOK_SECRET) {
      console.warn('[razorpay][callback] missing signature or webhook secret');
      return NextResponse.json({ success: true }); // return 200 to avoid retries
    }

    const expected = crypto.createHmac('sha256', String(WEBHOOK_SECRET)).update(bodyText).digest('hex');
    if (expected !== String(headerSig)) {
      console.warn('[razorpay][callback] invalid signature');
      return NextResponse.json({ success: true });
    }

    // Determine event type and relevant ids
    const event = body.event || body.event_type || '';
    const paymentEntity = body?.payload?.payment?.entity || body?.payload?.payment || body?.payload?.payment || body?.payment || {};
    const razorpayPaymentId = paymentEntity?.id || paymentEntity?.payment_id || '';
    const razorpayOrderId = paymentEntity?.order_id || paymentEntity?.orderId || '';

    // Try to find merchant order id via payload (if order object has receipt or if we stored mapping earlier)
    // We'll call the shared finalizer with CAPTURED for payment.captured
    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      await finalizeOrder({ provider: 'razorpay', merchantOrderId: String(razorpayOrderId), txId: String(razorpayPaymentId), state: 'CAPTURED', providerResponse: body });
    } else if (event === 'payment.failed') {
      await finalizeOrder({ provider: 'razorpay', merchantOrderId: String(razorpayOrderId), txId: String(razorpayPaymentId), state: 'FAILED', providerResponse: body });
    } else {
      console.info('[razorpay][callback] unhandled event', event);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[razorpay][callback] error', err);
    return NextResponse.json({ success: true });
  }
}
