import { connectToDatabase } from '@/lib/db';
import Audit from '@/models/Audit';
import type { AuditMetadata } from '@/lib/audit/types';

export type WriteAuditEventInput = {
  action: string;
  orderId?: string;
  adminId?: string;
  userId?: string;
  metadata?: AuditMetadata;
  before?: string;
  after?: string;
  reason?: string;
};

/** Append-only audit write. Never throws — failures are logged only. */
export async function writeAuditEvent(input: WriteAuditEventInput): Promise<void> {
  try {
    await connectToDatabase();
    await Audit.create({
      action: input.action,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      ...(input.adminId ? { adminId: input.adminId } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.before !== undefined ? { before: input.before } : {}),
      ...(input.after !== undefined ? { after: input.after } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    });
  } catch (error) {
    console.warn('[audit] write failed', { action: input.action, error });
  }
}

export type WriteAdminAuditEventInput = Omit<WriteAuditEventInput, 'adminId'> & {
  adminId: string;
};

/** Admin mutation audit — fire-and-forget, always records adminId. */
export function writeAdminAuditEvent(input: WriteAdminAuditEventInput): void {
  void writeAuditEvent(input);
}
