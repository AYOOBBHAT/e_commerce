import type {
  CashfreeInitiatePayload,
  PhonePeInitiatePayload,
  PhonePeProdTestPayload,
  RazorpayOrderPayload,
  RazorpayVerifyPayload,
} from '@/lib/payments/types';

export type ValidationFailure = { ok: false; error: string };
export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseJsonBody(text: string): ValidationResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, error: 'Invalid JSON body' };
  }
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  field: string,
  label = field,
): ValidationResult<string> {
  const raw = record[field];
  if (typeof raw !== 'string') {
    return { ok: false, error: `Missing or invalid ${label}` };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: `${label} cannot be empty` };
  }
  return { ok: true, value: trimmed };
}

function optionalNonEmptyString(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  const raw = record[field];
  if (raw == null) return undefined;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

function optionalFiniteNumber(
  record: Record<string, unknown>,
  field: string,
): number | undefined {
  const raw = record[field];
  if (raw == null) return undefined;
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num)) return undefined;
  return num;
}

function optionalCurrency(record: Record<string, unknown>): string {
  const raw = record.currency;
  if (typeof raw !== 'string' || !raw.trim()) return 'INR';
  return raw.trim().toUpperCase();
}

export function parseRazorpayOrderPayload(body: unknown): ValidationResult<RazorpayOrderPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const receipt = requireNonEmptyString(body, 'receipt', 'order reference (receipt)');
  if (!receipt.ok) return receipt;

  const amount = optionalFiniteNumber(body, 'amount');
  if (body.amount != null && amount === undefined) {
    return { ok: false, error: 'amount must be a valid number' };
  }

  return {
    ok: true,
    value: {
      receipt: receipt.value,
      currency: optionalCurrency(body),
      amount,
    },
  };
}

export function parseRazorpayVerifyPayload(body: unknown): ValidationResult<RazorpayVerifyPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const razorpayPaymentId = requireNonEmptyString(body, 'razorpayPaymentId', 'razorpayPaymentId');
  if (!razorpayPaymentId.ok) return razorpayPaymentId;

  const razorpayOrderId = requireNonEmptyString(body, 'razorpayOrderId', 'razorpayOrderId');
  if (!razorpayOrderId.ok) return razorpayOrderId;

  const razorpaySignature = requireNonEmptyString(body, 'razorpaySignature', 'razorpaySignature');
  if (!razorpaySignature.ok) return razorpaySignature;

  const merchantOrderId = optionalNonEmptyString(body, 'merchantOrderId');

  return {
    ok: true,
    value: {
      merchantOrderId,
      razorpayPaymentId: razorpayPaymentId.value,
      razorpayOrderId: razorpayOrderId.value,
      razorpaySignature: razorpaySignature.value,
    },
  };
}

export function parsePhonePeInitiatePayload(body: unknown): ValidationResult<PhonePeInitiatePayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const orderId = requireNonEmptyString(body, 'orderId', 'orderId');
  if (!orderId.ok) return orderId;

  const amount = optionalFiniteNumber(body, 'amount');
  if (body.amount != null && amount === undefined) {
    return { ok: false, error: 'amount must be a valid number' };
  }

  const redirectUrl = optionalNonEmptyString(body, 'redirectUrl');
  if (body.redirectUrl != null && typeof body.redirectUrl === 'string' && !redirectUrl) {
    return { ok: false, error: 'redirectUrl cannot be empty if provided' };
  }

  return {
    ok: true,
    value: {
      orderId: orderId.value,
      amount,
      redirectUrl,
    },
  };
}

export function parseCashfreeInitiatePayload(body: unknown): ValidationResult<CashfreeInitiatePayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const orderId = requireNonEmptyString(body, 'orderId', 'orderId');
  if (!orderId.ok) return orderId;

  const amount = optionalFiniteNumber(body, 'amount');
  if (body.amount != null && amount === undefined) {
    return { ok: false, error: 'amount must be a valid number' };
  }

  const redirectUrl = optionalNonEmptyString(body, 'redirectUrl');
  if (body.redirectUrl != null && typeof body.redirectUrl === 'string' && !redirectUrl) {
    return { ok: false, error: 'redirectUrl cannot be empty if provided' };
  }

  let customerDetails: CashfreeInitiatePayload['customerDetails'];
  if (body.customerDetails != null) {
    if (!isRecord(body.customerDetails)) {
      return { ok: false, error: 'customerDetails must be an object' };
    }
    customerDetails = {
      customer_id: optionalNonEmptyString(body.customerDetails, 'customer_id'),
      customer_name: optionalNonEmptyString(body.customerDetails, 'customer_name'),
      customer_email: optionalNonEmptyString(body.customerDetails, 'customer_email'),
      customer_phone: optionalNonEmptyString(body.customerDetails, 'customer_phone'),
    };
  }

  return {
    ok: true,
    value: {
      orderId: orderId.value,
      amount,
      redirectUrl,
      customerDetails,
    },
  };
}

export function parsePhonePeProdTestPayload(body: unknown): ValidationResult<PhonePeProdTestPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const actionRaw = body.action;
  if (actionRaw !== 'create-and-initiate' && actionRaw !== 'simulate-webhook') {
    return { ok: false, error: 'action must be create-and-initiate or simulate-webhook' };
  }

  if (body.confirm !== true) {
    return { ok: false, error: 'Must set confirm=true to run production test' };
  }

  const orderId = optionalNonEmptyString(body, 'orderId');
  if (actionRaw === 'simulate-webhook' && !orderId) {
    return { ok: false, error: 'orderId is required for simulate-webhook' };
  }

  return {
    ok: true,
    value: {
      action: actionRaw,
      confirm: true,
      orderId,
    },
  };
}

export function asRazorpayWebhookPayload(body: unknown) {
  return isRecord(body) ? body : {};
}

export function asPhonePeWebhookPayload(body: unknown) {
  return isRecord(body) ? body : {};
}

export function asCashfreeWebhookPayload(body: unknown) {
  return isRecord(body) ? body : {};
}
