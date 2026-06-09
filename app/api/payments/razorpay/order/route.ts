import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { resolveOrderPaymentAmount } from '@/lib/orders/payment-amount';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

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

    const body = await req.json();
    const { amount, currency = 'INR', receipt } = body;
    if (!receipt) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
    }

    const paymentAmount = await resolveOrderPaymentAmount(String(receipt), amount);
    if (!paymentAmount.ok) {
      return NextResponse.json({ error: paymentAmount.error }, { status: paymentAmount.status });
    }

    const orderAmount = paymentAmount.amount;

    if (!KEY_ID || !KEY_SECRET) {
      console.warn('[razorpay][order] missing keys, returning dummy order for local dev');
      // Return minimal fake order to allow frontend flows in dev
      return NextResponse.json({ id: `order_fake_${Date.now()}`, amount: Math.round(orderAmount * 100), currency });
    }

    const rzp = new Razorpay({ key_id: String(KEY_ID), key_secret: String(KEY_SECRET) });
    const options = {
      amount: Math.round(orderAmount * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await rzp.orders.create(options as any);

    // If client passed our internal receipt (merchant order id), store mapping to help webhooks
    try {
      const receipt = options.receipt;
      if (receipt) {
        const OrderModel = require('@/models/Order').default;
        const found = await OrderModel.findById(String(receipt));
        if (found) {
          found.paymentInfo = found.paymentInfo || {};
          found.paymentInfo.method = 'razorpay';
          found.paymentInfo.razorpayOrderId = order.id || order.id;
          await found.save();
        }
      }
    } catch (e) {
      console.warn('[razorpay][order] could not persist razorpay order id on merchant receipt', e);
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('[razorpay][order] error creating order', err);
    return NextResponse.json({ error: err?.message || 'Failed to create order' }, { status: 500 });
  }
}

// Helpful GET for sanity and OPTIONS for preflight/CORS
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