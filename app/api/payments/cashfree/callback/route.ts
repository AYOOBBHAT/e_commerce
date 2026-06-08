import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';

const CASHFREE_SECRET = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const BASE_URL = process.env.CASHFREE_BASE_URL || (CASHFREE_APP_ID?.startsWith('TEST') ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg');
const API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    const sigHeader = request.headers.get('x-webhook-signature') || request.headers.get('x-cf-signature') || request.headers.get('signature');

    // If secret configured, validate HMAC-SHA256 of body
    if (CASHFREE_SECRET && sigHeader) {
      const expected = crypto.createHmac('sha256', String(CASHFREE_SECRET)).update(bodyText).digest('hex');
      if (expected !== String(sigHeader)) {
        console.warn('[cashfree][callback] invalid signature');
        return NextResponse.json({ success: true });
      }
    }

    // Attempt to extract order id and payment id
    const orderId = body?.order_id || body?.orderId || body?.data?.order_id || body?.data?.orderId;
    const paymentId = body?.payment_id || body?.paymentId || body?.data?.payment_id || body?.data?.paymentId;
    const status = (body?.order_status || body?.status || body?.data?.paymentStatus || '').toString().toUpperCase();

    // Optionally, confirm status with Cashfree status API if credentials present
    let resolvedState = '';
    if (status) {
      if (status.includes('PAID') || status.includes('SUCCESS') || status.includes('COMPLETED') || status.includes('CAPTURED')) resolvedState = 'PAID';
      if (status.includes('FAILED') || status.includes('CANCELLED')) resolvedState = 'FAILED';
      if (!resolvedState) resolvedState = status;
    }

    // If no explicit status in payload, try fetching order status from Cashfree
    if (!resolvedState && CASHFREE_APP_ID && CASHFREE_SECRET) {
      try {
        const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-version': API_VERSION,
            'x-client-id': CASHFREE_APP_ID,
            'x-client-secret': CASHFREE_SECRET,
          },
        });
        if (res.ok) {
          const d = await res.json();
          const remoteStatus = (d?.order_status || d?.status || '').toString().toUpperCase();
          if (remoteStatus.includes('PAID') || remoteStatus.includes('SUCCESS') || remoteStatus.includes('COMPLETED')) resolvedState = 'PAID';
          if (remoteStatus.includes('FAILED') || remoteStatus.includes('CANCELLED')) resolvedState = 'FAILED';
        }
      } catch (e) {
        console.warn('[cashfree][callback] failed to fetch order status', e);
      }
    }

    // If still no resolved state, set to PENDING
    if (!resolvedState) resolvedState = 'PENDING';

    // Use shared finalizer — Cashfree order_id is expected to be our merchant order id when creating the order
    const result = await finalizeOrder({
      provider: 'cashfree',
      merchantOrderId: String(orderId),
      txId: String(paymentId || ''),
      state: resolvedState,
      providerResponse: body,
    });

    if (!result.ok && result.inventoryError) {
      console.error('[cashfree][callback] inventory finalize failed', {
        orderId,
        inventoryError: result.inventoryError,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[cashfree][callback] error', err);
    return NextResponse.json({ success: true });
  }
}

