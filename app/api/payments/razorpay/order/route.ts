import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { resolveOrderPaymentAmount } from '@/lib/orders/payment-amount';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { parseRazorpayOrderPayload } from '@/lib/payments/validation';
import type { RazorpayOrderCreateParams, RazorpayOrderResponse } from '@/lib/payments/types';
import { writeAuditEvent } from '@/lib/audit/write-audit-event';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit(req, {
      windowMs: 60 * 1000,
      maxRequests: 15,
      keyPrefix: 'payments:razorpay:order',
      limitHeader: '15',
      critical: true,
      fallbackMaxRequests: 5,
    });
    if (limited) return limited;

    const rawBody: unknown = await req.json();
    const parsed = parseRazorpayOrderPayload(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { receipt, currency, amount } = parsed.value;

    const paymentAmount = await resolveOrderPaymentAmount(receipt, amount);
    if (!paymentAmount.ok) {
      return NextResponse.json({ error: paymentAmount.error }, { status: paymentAmount.status });
    }

    const orderAmount = paymentAmount.amount;

    if (!KEY_ID || !KEY_SECRET) {
      console.warn('[razorpay][order] missing keys, returning dummy order for local dev');
      return NextResponse.json({
        id: `order_fake_${Date.now()}`,
        amount: Math.round(orderAmount * 100),
        currency,
      } satisfies RazorpayOrderResponse);
    }

    const rzp = new Razorpay({ key_id: String(KEY_ID), key_secret: String(KEY_SECRET) });
    const options: RazorpayOrderCreateParams = {
      amount: Math.round(orderAmount * 100),
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = (await rzp.orders.create(options)) as RazorpayOrderResponse;

    try {
      const OrderModel = require('@/models/Order').default;
      const found = await OrderModel.findById(String(receipt));
      if (found) {
        found.paymentInfo = found.paymentInfo || {};
        found.paymentInfo.method = 'razorpay';
        found.paymentInfo.razorpayOrderId = order.id;
        await found.save();
      }
    } catch (persistErr: unknown) {
      console.warn(
        '[razorpay][order] could not persist razorpay order id on merchant receipt',
        getErrorMessage(persistErr, 'persist failed'),
      );
    }

    void writeAuditEvent({
      action: AUDIT_ACTIONS.PAYMENT_INITIATED,
      orderId: receipt,
      metadata: {
        provider: 'razorpay',
        transactionId: order.id,
        paymentStatus: 'pending',
        paymentMethod: 'razorpay',
        source: 'payment_initiate',
      },
    });

    return NextResponse.json(order);
  } catch (err: unknown) {
    console.error('[razorpay][order] error creating order', err);
    return NextResponse.json(
      { error: getErrorMessage(err, 'Failed to create order') },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Razorpay order endpoint (POST) is alive' });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
