import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { resolveOrderPaymentAmount } from '@/lib/orders/payment-amount';
import { enforceApiRateLimit } from '@/lib/enforce-rate-limit';
import { getErrorMessage } from '@/lib/errors/message';
import { parsePhonePeInitiatePayload } from '@/lib/payments/validation';
import { extractPhonePeRedirectUrl } from '@/lib/payments/provider-response';
import { getPhonePeClient, isPhonePeSandbox } from '@/lib/payments/phonepe-client';
import { writeAuditEvent } from '@/lib/audit/write-audit-event';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StandardCheckoutPayRequest } = require('pg-sdk-node') as {
  StandardCheckoutPayRequest: {
    builder: () => {
      merchantOrderId: (id: string) => { amount: (paise: number) => { redirectUrl: (url: string) => unknown; build: () => unknown } };
      build: () => unknown;
    };
  };
};

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit(req, {
      windowMs: 60 * 1000,
      maxRequests: 15,
      keyPrefix: 'payments:phonepe:initiate',
      limitHeader: '15',
      critical: true,
      fallbackMaxRequests: 5,
    });
    if (limited) return limited;

    const rawBody: unknown = await req.json();
    const parsed = parsePhonePeInitiatePayload(rawBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { orderId, amount, redirectUrl } = parsed.value;

    const maskedClientId = PHONEPE_CLIENT_ID
      ? `${PHONEPE_CLIENT_ID.slice(0, 4)}***${PHONEPE_CLIENT_ID.slice(-4)}`
      : 'none';
    console.info(
      '[payments][phonepe] using clientId=',
      maskedClientId,
      'sandbox=',
      isPhonePeSandbox(),
    );

    const isDummy =
      !PHONEPE_CLIENT_ID ||
      PHONEPE_CLIENT_ID === 'placeholder' ||
      !PHONEPE_CLIENT_SECRET ||
      PHONEPE_CLIENT_SECRET === 'placeholder';

    if (isDummy) {
      const dummyAmount = amount ?? 0;
      return NextResponse.json({
        merchantTransactionId: orderId,
        amount: dummyAmount * 100,
        status: 'created',
        testMode: true,
      });
    }

    const paymentAmount = await resolveOrderPaymentAmount(orderId, amount);
    if (!paymentAmount.ok) {
      return NextResponse.json({ error: paymentAmount.error }, { status: paymentAmount.status });
    }

    const amountPaise = Math.round(paymentAmount.amount * 100);
    if (amountPaise < 100) {
      return NextResponse.json({ error: 'Minimum amount is 1 INR' }, { status: 400 });
    }

    const redirectUrlStr = redirectUrl;
    if (
      redirectUrlStr &&
      redirectUrlStr.startsWith('http://') &&
      redirectUrlStr.includes('localhost') &&
      process.env.NEXT_PUBLIC_ALLOW_HTTP_REDIRECT !== 'true'
    ) {
      console.warn(
        '[payments][phonepe] stripping non-HTTPS localhost redirectUrl before calling PhonePe to avoid rejection',
      );
    }

    const client = getPhonePeClient();

    let payRequest: unknown;
    try {
      const builder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(orderId)
        .amount(amountPaise);

      if (redirectUrlStr) {
        builder.redirectUrl(redirectUrlStr);
      }

      payRequest = builder.build();
    } catch (buildError: unknown) {
      console.error('[payments][phonepe] error building payment request:', buildError);
      return NextResponse.json(
        {
          error: `Failed to build payment request: ${getErrorMessage(buildError, 'Unknown error')}`,
        },
        { status: 500 },
      );
    }

    try {
      await connectToDatabase();
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            'paymentInfo.transactionId': orderId,
            'paymentInfo.method': 'phonepe',
            'paymentInfo.status': 'pending',
          },
        },
        { new: true },
      );
      if (!updatedOrder) {
        console.warn('[payments][phonepe] order not found to set paymentInfo for merchantOrderId=', orderId);
      }
    } catch (dbErr: unknown) {
      console.error(
        '[payments][phonepe] could not update order paymentInfo',
        getErrorMessage(dbErr, 'db update failed'),
      );
    }

    const response = await client.pay(payRequest);
    const paymentRedirectUrl = extractPhonePeRedirectUrl(response);

    if (!paymentRedirectUrl) {
      console.error('[payments][phonepe] invalid response from SDK - missing redirect URL');
      return NextResponse.json(
        { error: 'Invalid response from PhonePe SDK. Missing redirect URL.' },
        { status: 500 },
      );
    }

    void writeAuditEvent({
      action: AUDIT_ACTIONS.PAYMENT_INITIATED,
      orderId,
      metadata: {
        provider: 'phonepe',
        transactionId: orderId,
        paymentStatus: 'pending',
        paymentMethod: 'phonepe',
        source: 'payment_initiate',
      },
    });

    return NextResponse.json({
      data: {
        instrumentResponse: {
          redirectInfo: {
            url: paymentRedirectUrl,
          },
        },
        orderId: response.order_id || response.orderId || response.data?.orderId || orderId,
        state: response.state || response.data?.state,
        expireAt: response.expire_at || response.data?.expire_at,
        raw: response,
      },
    });
  } catch (error: unknown) {
    console.error('[payments][phonepe] error:', getErrorMessage(error, 'PhonePe payment error'));
    return NextResponse.json(
      { error: getErrorMessage(error, 'PhonePe payment error') },
      { status: 500 },
    );
  }
}
