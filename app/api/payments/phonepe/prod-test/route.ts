import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';

/**
 * Guarded production test endpoint
 * - Only active when ALLOW_PROD_TEST=true
 * - Requires header `x-prod-test-key` matching process.env.PROD_TEST_KEY
 * - POST body: { action: 'create-and-initiate' | 'simulate-webhook', confirm: true, orderId?: string }
 *
 * create-and-initiate: creates a flagged test order (isProductionTest=true) for amount 1 INR and calls /api/payments/phonepe to get a redirect URL
 * simulate-webhook: simulates a PhonePe callback against /api/payments/phonepe/callback for a flagged test order
 */

function isAllowed() {
  return String(process.env.ALLOW_PROD_TEST || '').toLowerCase() === 'true';
}

function getBaseUrl(request: NextRequest) {
  // Prefer explicit BASE_URL env var for production
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  const host = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowed()) {
      return NextResponse.json({ error: 'Prod test disabled' }, { status: 403 });
    }

    const key = request.headers.get('x-prod-test-key');
    if (!key || !process.env.PROD_TEST_KEY || key !== process.env.PROD_TEST_KEY) {
      return NextResponse.json({ error: 'Unauthorized: invalid prod test key' }, { status: 401 });
    }

    const body = await request.json();
    const { action, confirm, orderId } = body || {};

    if (!confirm) {
      return NextResponse.json({ error: 'Must set confirm=true to run production test' }, { status: 400 });
    }

    await connectToDatabase();

    const base = getBaseUrl(request);

    if (action === 'create-and-initiate') {
      // Create flagged test order and initiate payment via internal API
      const orderPayload: any = {
        orderId: 'PRODTEST-' + Date.now(),
        customer: { name: 'Prod Test', email: process.env.PROD_TEST_EMAIL || 'prodtest@example.com', phone: process.env.PROD_TEST_PHONE || '9999999999' },
        shippingAddress: 'Prod test address',
        items: [{ product: null, name: 'Prod test item', price: 1, quantity: 1, image: '' }],
        orderItems: [{ product: null, name: 'Prod test item', image: '', price: 1, quantity: 1 }],
        total: 1,
        totalPrice: 1,
        paymentMethod: 'phonepe',
        paymentInfo: { method: 'phonepe', status: 'pending' },
        status: 'pending',
        isProductionTest: true,
      };

      const created = await Order.create(orderPayload);

      // Initiate payment by calling internal payments endpoint
      const payload = {
        amount: 1,
        orderId: String(created._id),
        redirectUrl: `${base}/order-success?orderId=${String(created._id)}`,
      };

      const res = await fetch(`${base}/api/payments/phonepe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      return NextResponse.json({
        success: true,
        createdOrderId: created._id,
        paymentResponse: data,
      });
    }

    if (action === 'simulate-webhook') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required for simulate-webhook' }, { status: 400 });
      }

      // Ensure the order exists and is a flagged test
      const order = await Order.findById(orderId);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      if (!order.isProductionTest) return NextResponse.json({ error: 'Order is not a production test order' }, { status: 400 });

      const txnId = 'PRODTEST-TXN-' + Date.now();
      const callbackBody = {
        event: 'CHECKOUT_ORDER_COMPLETED',
        data: {
          merchantOrderId: String(orderId),
          transactionId: txnId,
          state: 'COMPLETED',
          amount: 100,
        },
      };

      const bodyString = JSON.stringify(callbackBody);
      const username = process.env.PHONEPE_WEBHOOK_USERNAME || '';
      const password = process.env.PHONEPE_WEBHOOK_PASSWORD || '';
      const crypto = await import('crypto');
      const expectedHash = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');

      const callbackRes = await fetch(`${base}/api/payments/phonepe/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${expectedHash}`,
        },
        body: bodyString,
      });

      const cbResp = await callbackRes.json();

      return NextResponse.json({ success: true, callbackResponse: cbResp });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[payments][phonepe][prod-test] error', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}