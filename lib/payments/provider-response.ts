import { isRecord } from '@/lib/payments/validation';
import type {
  PhonePeOrderStatusResponse,
  PhonePePayResponse,
} from '@/lib/payments/types';

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNestedString(
  root: Record<string, unknown>,
  path: string[],
): string | undefined {
  let current: unknown = root;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return typeof current === 'string' && current.trim() ? current.trim() : undefined;
}

/** Extract merchant/internal order id candidates from a provider callback payload. */
export function extractMerchantOrderIdFromProviderResponse(
  providerResponse: unknown,
): string | undefined {
  if (!isRecord(providerResponse)) return undefined;

  const direct =
    readString(providerResponse, 'merchantOrderId', 'merchantTransactionId', 'merchant_order_id', 'order_id', 'orderId') ||
    readNestedString(providerResponse, ['data', 'merchantOrderId']) ||
    readNestedString(providerResponse, ['data', 'merchantTransactionId']) ||
    readNestedString(providerResponse, ['data', 'order_id']);

  if (direct) return direct;

  const rzp =
    readNestedString(providerResponse, ['payload', 'payment', 'entity', 'order_id']) ||
    readNestedString(providerResponse, ['payload', 'payment', 'entity', 'orderId']) ||
    readNestedString(providerResponse, ['payment', 'order_id']) ||
    readString(providerResponse, 'order_id');

  return rzp;
}

export function extractRazorpayPaymentEntity(body: unknown): {
  razorpayPaymentId: string;
  razorpayOrderId: string;
} {
  const empty = { razorpayPaymentId: '', razorpayOrderId: '' };
  if (!isRecord(body)) return empty;

  const payloadPayment = isRecord(body.payload) && isRecord(body.payload.payment)
    ? body.payload.payment
    : null;
  const entityFromPayload =
    payloadPayment && isRecord(payloadPayment.entity) ? payloadPayment.entity : payloadPayment;
  const paymentEntity =
    (entityFromPayload && isRecord(entityFromPayload) ? entityFromPayload : null) ||
    (isRecord(body.payment) ? body.payment : {});

  const razorpayPaymentId = readString(paymentEntity, 'id', 'payment_id') || '';
  const razorpayOrderId = readString(paymentEntity, 'order_id', 'orderId') || '';

  return {
    razorpayPaymentId,
    razorpayOrderId,
  };
}

export function extractPhonePeWebhookIds(body: unknown): {
  merchantTransactionId: string;
  transactionId: string;
} {
  if (!isRecord(body)) {
    return { merchantTransactionId: '', transactionId: '' };
  }

  const data = isRecord(body.data) ? body.data : {};
  const merchantTransactionId =
    readString(data, 'merchantTransactionId', 'merchantOrderId', 'originalMerchantOrderId', 'orderId') || '';

  const paymentDetails = Array.isArray(data.paymentDetails)
    ? data.paymentDetails
    : Array.isArray(data.payment_details)
      ? data.payment_details
      : [];

  let transactionId = readString(data, 'transactionId') || '';
  if (!transactionId && paymentDetails.length > 0 && isRecord(paymentDetails[0])) {
    transactionId = readString(paymentDetails[0], 'transactionId') || '';
  }

  return {
    merchantTransactionId,
    transactionId,
  };
}

export function resolvePhonePeStatusState(statusResponse: PhonePeOrderStatusResponse): string {
  const rawState =
    statusResponse.state ||
    statusResponse.data?.state ||
    statusResponse.data?.status ||
    statusResponse.code ||
    statusResponse.data?.code ||
    '';
  return String(rawState || '').toUpperCase();
}

export function resolvePhonePeTransactionId(
  webhookTransactionId: string,
  statusResponse: PhonePeOrderStatusResponse,
): string {
  if (webhookTransactionId) return webhookTransactionId;

  const details =
    statusResponse.data?.payment_details?.[0]?.transactionId ||
    statusResponse.data?.paymentDetails?.[0]?.transactionId ||
    statusResponse.data?.transactionId ||
    '';

  return String(details || '');
}

export function extractCashfreeWebhookFields(body: unknown): {
  orderId: string;
  paymentId: string;
  status: string;
} {
  if (!isRecord(body)) {
    return { orderId: '', paymentId: '', status: '' };
  }

  const data = isRecord(body.data) ? body.data : {};

  const orderId =
    readString(body, 'order_id', 'orderId') ||
    readString(data, 'order_id', 'orderId') ||
    '';

  const paymentId =
    readString(body, 'payment_id', 'paymentId') ||
    readString(data, 'payment_id', 'paymentId') ||
    '';

  const status = String(
    readString(body, 'order_status', 'status') ||
      readString(data, 'paymentStatus') ||
      '',
  ).toUpperCase();

  return { orderId, paymentId, status };
}

export function mapPaymentStatusToFinalizeState(status: string): string {
  const upper = status.toUpperCase();
  if (
    upper.includes('PAID') ||
    upper.includes('SUCCESS') ||
    upper.includes('COMPLETED') ||
    upper.includes('CAPTURED')
  ) {
    return 'PAID';
  }
  if (upper.includes('FAILED') || upper.includes('CANCELLED')) {
    return 'FAILED';
  }
  if (upper.includes('PENDING')) {
    return 'PENDING';
  }
  return upper;
}

export function extractPhonePeRedirectUrl(response: PhonePePayResponse): string | undefined {
  if (response.redirect_url) return response.redirect_url;
  if (response.redirectUrl) return response.redirectUrl;
  if (response.data?.instrumentResponse?.redirectInfo?.url) {
    return response.data.instrumentResponse.redirectInfo.url;
  }
  if (response.data?.redirect_url) return response.data.redirect_url;
  if (response.data?.redirectUrl) return response.data.redirectUrl;
  return undefined;
}
