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

