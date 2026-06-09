import crypto from 'crypto';

// Generate idempotency key from request data
// This is a utility function, not a server action
export function generateIdempotencyKey(data: {
  items: Array<{ id: string; quantity: number }>;
  total: number;
  email?: string;
  phone?: string;
}): string {
  const payload = JSON.stringify({
    items: data.items.map(item => ({ id: item.id, qty: item.quantity })),
    total: data.total,
    email: data.email,
    phone: data.phone,
  });
  
  return crypto.createHash('sha256').update(payload).digest('hex');
}

type ResolveIdempotencyKeyInput = {
  clientKey: unknown;
  items: Array<{ id: string; quantity: number }>;
  total: number;
  email?: string;
  phone?: string;
};

export type ResolveIdempotencyKeyResult =
  | { ok: true; key: string }
  | { ok: false; error: string };

/**
 * Use the client-provided key when present and non-empty.
 * When absent, derive a deterministic fallback for script/API callers.
 * Reject empty or invalid client keys with ok: false.
 */
export function resolveIdempotencyKey(
  input: ResolveIdempotencyKeyInput,
): ResolveIdempotencyKeyResult {
  const { clientKey, items, total, email, phone } = input;

  if (typeof clientKey === 'string') {
    const trimmed = clientKey.trim();
    if (trimmed.length > 0) {
      return { ok: true, key: trimmed };
    }
    return { ok: false, error: 'Idempotency key cannot be empty' };
  }

  if (clientKey !== undefined && clientKey !== null) {
    return { ok: false, error: 'Invalid idempotency key' };
  }

  return {
    ok: true,
    key: generateIdempotencyKey({ items, total, email, phone }),
  };
}

