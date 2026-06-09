import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder } from '@/lib/finalizePayment';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { parseJsonBody } from '@/lib/payments/validation';
import {
  extractCashfreeWebhookFields,
  mapPaymentStatusToFinalizeState,
} from '@/lib/payments/provider-response';
import type { CashfreeOrderStatusResponse } from '@/lib/payments/types';

const CASHFREE_SECRET = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const BASE_URL =
  process.env.CASHFREE_BASE_URL ||
  (CASHFREE_APP_ID?.startsWith('TEST')
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg');
const API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';

async function fetchCashfreeOrderStatus(orderId: string): Promise<string> {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET || !orderId) return '';

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
    if (!res.ok) return '';

    const data = (await res.json()) as CashfreeOrderStatusResponse;
    const remoteStatus = String(data.order_status || data.status || '').toUpperCase();
    return mapPaymentStatusToFinalizeState(remoteStatus);
  } catch (fetchErr: unknown) {
    console.warn(
      '[cashfree][callback] failed to fetch order status',
      getErrorMessage(fetchErr, 'status fetch failed'),
    );
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceApiRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 120,
      keyPrefix: 'payments:cashfree:callback',
      limitHeader: '120',
      critical: true,
      fallbackMaxRequests: 30,
    });
    if (limited) return limited;

    const bodyText = await request.text();
    const parsed = parseJsonBody(bodyText);
    if (!parsed.ok) {
      console.warn('[cashfree][callback] invalid JSON body');
      return NextResponse.json({ success: true });
    }

    const sigHeader =
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-cf-signature') ||
      request.headers.get('signature');

    if (CASHFREE_SECRET && sigHeader) {
      const expected = crypto
        .createHmac('sha256', String(CASHFREE_SECRET))
        .update(bodyText)
        .digest('hex');
      if (expected !== String(sigHeader)) {
        console.warn('[cashfree][callback] invalid signature');
        return NextResponse.json({ success: true });
      }
    }

    const { orderId, paymentId, status } = extractCashfreeWebhookFields(parsed.value);

    let resolvedState = status ? mapPaymentStatusToFinalizeState(status) : '';

    if (!resolvedState && orderId) {
      resolvedState = await fetchCashfreeOrderStatus(orderId);
    }

    if (!resolvedState) resolvedState = 'PENDING';

    const result = await finalizeOrder({
      provider: 'cashfree',
      merchantOrderId: orderId,
      txId: paymentId,
      state: resolvedState,
      providerResponse: parsed.value,
    });

    if (!result.ok && result.inventoryError) {
      console.error('[cashfree][callback] inventory finalize failed', {
        orderId,
        inventoryError: result.inventoryError,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[cashfree][callback] error', getErrorMessage(err, 'callback error'));
    return NextResponse.json({ success: true });
  }
}
