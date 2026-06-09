import type { OrderStatus } from '@/lib/orders/status-transitions';

/** Matches Admin Orders `?status=pending` filter (`pending` + `processing` only). */
export const ADMIN_PENDING_STATUSES: readonly OrderStatus[] = ['pending', 'processing'];

export type DashboardStatusBucket = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export function isAdminPendingStatus(status?: string): boolean {
  const normalized = (status || '').toLowerCase();
  return ADMIN_PENDING_STATUSES.includes(normalized as OrderStatus);
}

/**
 * Maps an order status to a dashboard tab bucket.
 * `confirmed` is excluded from Pending (aligned with Admin Orders).
 */
export function mapOrderStatusToDashboardBucket(
  status?: string,
): DashboardStatusBucket | 'confirmed' | null {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'shipped') return 'shipped';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  if (isAdminPendingStatus(normalized)) return 'pending';
  if (normalized === 'confirmed') return 'confirmed';
  return null;
}

export function buildAdminPendingStatusFilter(): { status: { $in: string[] } } {
  return { status: { $in: [...ADMIN_PENDING_STATUSES] } };
}
