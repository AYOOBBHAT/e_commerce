import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { finalizeOrder as finalizePaymentOrder } from '@/lib/finalizePayment';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { isRecord, parseJsonBody } from '@/lib/payments/validation';
import {
  extractPhonePeWebhookIds,
  resolvePhonePeStatusState,
  resolvePhonePeTransactionId,
} from '@/lib/payments/provider-response';
import {
  fetchPhonePeOrderStatus,
  getPhonePeClient,
  validatePhonePeWebhookSignature,
} from '@/lib/payments/phonepe-client';
import type { PhonePeCallbackValidation } from '@/lib/payments/types';

function mergeCallbackPayload(
  body: Record<string, unknown>,
  callbackValidation: PhonePeCallbackValidation,
): Record<string, unknown> {
  if (typeof callbackValidation !== 'object' || callbackValidation === null) {
    return body;
  }
  if ('payload' in callbackValidation && callbackValidation.payload) {
    body.data = body.data || callbackValidation.payload;
  }
  return body;
}

function readWebhookEvent(body: Record<string, unknown>, callbackValidation: PhonePeCallbackValidation): string {
  const fromBody = body.event;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  if (typeof callbackValidation === 'object' && callbackValidation !== null && 'type' in callbackValidation) {
    const eventType = callbackValidation.type;
    if (typeof eventType === 'string') return eventType;
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const limited = await enforceApiRateLimit(request, {
      windowMs: 60 * 1000,
      maxRequests: 120,
      keyPrefix: 'payments:phonepe:callback',
      limitHeader: '120',
      critical: true,
      fallbackMaxRequests: 30,
    });
    if (limited) return limited;

    const bodyText = await request.text();
    const parsed = parseJsonBody(bodyText);
    if (!parsed.ok) {
      console.warn('[payments][phonepe][callback] invalid JSON body');
      return NextResponse.json({ success: true });
    }

    const client = getPhonePeClient();
    const authHeader = request.headers.get('authorization');
    const callbackValidation = await validatePhonePeWebhookSignature(client, authHeader, bodyText);

    if (!callbackValidation) {
      console.error('[payments][phonepe][callback] invalid webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyRecord = isRecord(parsed.value) ? { ...parsed.value } : {};
    mergeCallbackPayload(bodyRecord, callbackValidation);

    console.info(
      '[payments][phonepe][callback] webhook received event=',
      readWebhookEvent(bodyRecord, callbackValidation),
    );

    const { merchantTransactionId, transactionId } = extractPhonePeWebhookIds(bodyRecord);

    if (!merchantTransactionId) {
      console.warn('[payments][phonepe][callback] no merchantTransactionId in webhook');
      return NextResponse.json({ success: true });
    }

    const statusResponse = await fetchPhonePeOrderStatus(client, merchantTransactionId);

    console.info('[payments][phonepe][callback] status API response', {
      code: statusResponse.code,
      success: statusResponse.success,
    });

    await connectToDatabase();

    const state = resolvePhonePeStatusState(statusResponse);
    const resolvedTransactionId = resolvePhonePeTransactionId(transactionId, statusResponse);

    try {
      const result = await finalizePaymentOrder({
        provider: 'phonepe',
        merchantOrderId: merchantTransactionId,
        txId: resolvedTransactionId,
        state,
        providerResponse: statusResponse,
      });
      if (!result.ok && result.inventoryError) {
        console.error('[payments][phonepe][callback] inventory finalize failed', {
          orderId: merchantTransactionId,
          inventoryError: result.inventoryError,
        });
      }
    } catch (err: unknown) {
      console.error(
        '[payments][phonepe][callback] finalizePaymentOrder error',
        getErrorMessage(err, 'finalize failed'),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(
      '[payments][phonepe][callback] error=',
      getErrorMessage(error, 'callback error'),
    );
    return NextResponse.json({ success: true });
  }
}
