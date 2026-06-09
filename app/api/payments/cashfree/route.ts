import { NextResponse } from 'next/server';
import { resolveOrderPaymentAmount } from '@/lib/orders/payment-amount';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';

// Use test URL for sandbox, production URL for live
const BASE_URL = process.env.CASHFREE_BASE_URL || 
  (CASHFREE_APP_ID?.startsWith('TEST') 
    ? 'https://sandbox.cashfree.com/pg' 
    : 'https://api.cashfree.com/pg');

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

    const { amount, orderId, redirectUrl, customerDetails } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const paymentAmount = await resolveOrderPaymentAmount(String(orderId), amount);
    if (!paymentAmount.ok) {
      return NextResponse.json({ error: paymentAmount.error }, { status: paymentAmount.status });
    }

    const orderAmount = paymentAmount.amount;
    const isDummy = !CASHFREE_APP_ID || CASHFREE_APP_ID === 'placeholder' || 
                   !CASHFREE_SECRET_KEY || CASHFREE_SECRET_KEY === 'placeholder';

    if (isDummy) {
      // Return fake response for test mode
      return NextResponse.json({
        order_id: orderId,
        payment_session_id: `session_${Date.now()}`,
        payment_link: `${redirectUrl}?test=true&order_id=${orderId}`,
        amount: orderAmount,
        status: 'created',
        testMode: true
      });
    }

    // Prepare order payload for Cashfree
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

    // Create order in Cashfree
    const orderResponse = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('Cashfree order creation error:', errorData);
      return NextResponse.json({ error: errorData }, { status: orderResponse.status });
    }

    const orderData = await orderResponse.json();

    // Create payment session
    const sessionPayload = {
      order_token: orderData.order_token,
    };

    const sessionResponse = await fetch(`${BASE_URL}/orders/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      console.error('Cashfree session creation error:', errorData);
      return NextResponse.json({ error: errorData }, { status: sessionResponse.status });
    }

    const sessionData = await sessionResponse.json();

    return NextResponse.json({
      order_id: orderData.order_id,
      payment_session_id: sessionData.payment_session_id,
      payment_link: `https://payments.cashfree.com/forms/cashfree/${sessionData.payment_session_id}`,
      ...sessionData,
    });
  } catch (error: any) {
    console.error('Cashfree error:', error);
    return NextResponse.json(
      { error: error?.message || 'Cashfree payment error' },
      { status: 500 }
    );
  }
}

