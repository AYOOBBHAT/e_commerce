const ADMIN_ORDER_PATCH_ALLOWED_FIELDS = new Set(['status', 'trackingNumber']);

export type AdminOrderPatchInput = {
  status?: string;
  trackingNumber?: string;
};

export function parseAdminOrderPatchBody(
  body: unknown,
):
  | { ok: true; value: AdminOrderPatchInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length === 0) {
    return { ok: false, error: 'No valid fields to update.' };
  }

  for (const key of keys) {
    if (ADMIN_ORDER_PATCH_ALLOWED_FIELDS.has(key)) continue;

    if (key === 'paymentInfo') {
      return {
        ok: false,
        error:
          'Payment details cannot be updated from the admin API. Payment state is managed by payment gateways.',
      };
    }

    return {
      ok: false,
      error: `Field "${key}" cannot be updated on this endpoint.`,
    };
  }

  const value: AdminOrderPatchInput = {};

  if ('status' in record) {
    if (typeof record.status !== 'string' || !record.status.trim()) {
      return { ok: false, error: 'status must be a non-empty string.' };
    }
    value.status = record.status.trim();
  }

  if ('trackingNumber' in record) {
    if (record.trackingNumber == null || record.trackingNumber === '') {
      value.trackingNumber = undefined;
    } else if (typeof record.trackingNumber === 'string') {
      value.trackingNumber = record.trackingNumber.trim();
    } else {
      return { ok: false, error: 'trackingNumber must be a string.' };
    }
  }

  return { ok: true, value };
}
