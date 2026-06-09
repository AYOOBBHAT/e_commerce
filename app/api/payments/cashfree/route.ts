import { NextResponse } from 'next/server';
import { resolveOrderPaymentAmount } from '@/lib/orders/payment-amount';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { parseCashfreeInitiatePayload } from '@/lib/payments/validation';
import type {
  CashfreeOrderApiResponse,
  CashfreeSessionApiResponse,
} from '@/lib/payments/types';
import { writeAuditEvent } from '@/lib/audit/write-audit-event';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';

const BASE_URL =
  process.env.CASHFREE_BASE_URL ||
  (CASHFREE_APP_ID?.startsWith('TEST')
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg');

async function readCashfreeError(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: `HTTP ${response.status}` };
  }
}

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit(req, {
      windowMs: 60 * 1000,
      maxRequests: 15,
      keyPrefix: 'payments:cashfree:initiate',
      limitHeader: '15',
      critical: true,
      fallbackMaxRequests: 5,
    });
    if (limited) return limited;

    const rawBody: unknown = await req.json();
    const parsed = parseCashfreeInitiatePayload(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { orderId, amount, redirectUrl, customerDetails } = parsed.value;

    const paymentAmount = await resolveOrderPaymentAmount(orderId, amount);
    if (!paymentAmount.ok) {
      return NextResponse.json({ error: paymentAmount.error }, { status: paymentAmount.status });
    }

    const orderAmount = paymentAmount.amount;
    const isDummy =
      !CASHFREE_APP_ID ||
      CASHFREE_APP_ID === 'placeholder' ||
      !CASHFREE_SECRET_KEY ||
      CASHFREE_SECRET_KEY === 'placeholder';

    if (isDummy) {
      return NextResponse.json({
        order_id: orderId,
        payment_session_id: `session_${Date.now()}`,
        payment_link: `${redirectUrl || ''}?test=true&order_id=${orderId}`,
        amount: orderAmount,
        status: 'created',
        testMode: true,
      });
    }

    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails?.customer_id || orderId,
        customer_name: customerDetails?.customer_name || 'Customer',
        customer_email: customerDetails?.customer_email || '',
        customer_phone: customerDetails?.customer_phone || '',
      },
      order_meta: {
        return_url: redirectUrl,
        notify_url: `${req.headers.get('origin') || 'https://your-domain.vercel.app'}/api/payments/cashfree/callback`,
      },
    };

    const orderResponse = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID ?? '',
        'x-client-secret': CASHFREE_SECRET_KEY ?? '',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await readCashfreeError(orderResponse);
      console.error('Cashfree order creation error:', errorData);
      return NextResponse.json({ error: errorData }, { status: orderResponse.status });
    }

    const orderData = (await orderResponse.json()) as CashfreeOrderApiResponse;

    if (!orderData.order_token) {
      return NextResponse.json({ error: 'Cashfree order response missing order_token' }, { status: 502 });
    }

    const sessionResponse = await fetch(`${BASE_URL}/orders/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID ?? '',
        'x-client-secret': CASHFREE_SECRET_KEY ?? '',
      },
      body: JSON.stringify({ order_token: orderData.order_token }),
    });

    if (!sessionResponse.ok) {
      const errorData = await readCashfreeError(sessionResponse);
      console.error('Cashfree session creation error:', errorData);
      return NextResponse.json({ error: errorData }, { status: sessionResponse.status });
    }

    const sessionData = (await sessionResponse.json()) as CashfreeSessionApiResponse;

    if (!sessionData.payment_session_id) {
      return NextResponse.json(
        { error: 'Cashfree session response missing payment_session_id' },
        { status: 502 },
      );
    }

    void writeAuditEvent({
      action: AUDIT_ACTIONS.PAYMENT_INITIATED,
      orderId,
      metadata: {
        provider: 'cashfree',
        transactionId: sessionData.payment_session_id,
        paymentStatus: 'pending',
        paymentMethod: 'cashfree',
        source: 'payment_initiate',
      },
    });

    return NextResponse.json({
      order_id: orderData.order_id,
      payment_session_id: sessionData.payment_session_id,
      payment_link: `https://payments.cashfree.com/forms/cashfree/${sessionData.payment_session_id}`,
      ...sessionData,
    });
  } catch (error: unknown) {
    console.error('Cashfree error:', getErrorMessage(error, 'Cashfree payment error'));
    return NextResponse.json(
      { error: getErrorMessage(error, 'Cashfree payment error') },
      { status: 500 },
    );
  }
}
