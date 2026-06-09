import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';
import { getErrorMessage } from '@/lib/errors/message';
import { parseJsonBody } from '@/lib/payments/validation';
import { extractRazorpayPaymentEntity } from '@/lib/payments/provider-response';
import { isRecord } from '@/lib/payments/validation';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

function readWebhookEvent(body: unknown): string {
  if (!isRecord(body)) return '';
  const event = body.event ?? body.event_type;
  return typeof event === 'string' ? event : '';
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const parsed = parseJsonBody(bodyText);
    if (!parsed.ok) {
      console.warn('[razorpay][callback] invalid JSON body');
      return NextResponse.json({ success: true });
    }
    const body = parsed.value;

    const headerSig =
      request.headers.get('x-razorpay-signature') ||
      request.headers.get('x-razorpay-signature');

    if (!headerSig || !WEBHOOK_SECRET) {
      console.warn('[razorpay][callback] missing signature or webhook secret');
      return NextResponse.json({ success: true });
    }

    const expected = crypto
      .createHmac('sha256', String(WEBHOOK_SECRET))
      .update(bodyText)
      .digest('hex');
    if (expected !== String(headerSig)) {
      console.warn('[razorpay][callback] invalid signature');
      return NextResponse.json({ success: true });
    }

    const event = readWebhookEvent(body);
    const { razorpayPaymentId, razorpayOrderId } = extractRazorpayPaymentEntity(body);

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      const result = await finalizeOrder({
        provider: 'razorpay',
        merchantOrderId: razorpayOrderId,
        txId: razorpayPaymentId,
        state: 'CAPTURED',
        providerResponse: body,
      });
      if (!result.ok && result.inventoryError) {
        console.error('[razorpay][callback] inventory finalize failed', {
          razorpayOrderId,
          inventoryError: result.inventoryError,
        });
      }
    } else if (event === 'payment.failed') {
      await finalizeOrder({
        provider: 'razorpay',
        merchantOrderId: razorpayOrderId,
        txId: razorpayPaymentId,
        state: 'FAILED',
        providerResponse: body,
      });
    } else {
      console.info('[razorpay][callback] unhandled event', event);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[razorpay][callback] error', getErrorMessage(err, 'callback error'));
    return NextResponse.json({ success: true });
  }
}
