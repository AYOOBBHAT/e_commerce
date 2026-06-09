import Order from '@/models/Order';
import type { IOrder } from '@/models/Order';
import type { HydratedDocument } from 'mongoose';
import { connectToDatabase } from './db';
import nodemailer from 'nodemailer';
import { restoreInventoryWithClaim } from '@/lib/orders/inventory-restore';
import {
  applyInventoryForOrderLines,
  claimInventoryFinalizeLockWithRetry,
  commitInventoryFinalize,
  extractOrderInventoryLines,
  releaseInventoryFinalizeLock,
  rollbackInventoryAdjustments,
  clearInventoryReservation,
} from '@/lib/orders/inventory-apply';
import {
  isPrepaidOrderFinalized,
  verifyOrderInventoryConsistency,
  type OrderInventorySnapshot,
} from '@/lib/orders/inventory-consistency';
import { getErrorMessage } from '@/lib/errors/message';
import { extractMerchantOrderIdFromProviderResponse } from '@/lib/payments/provider-response';
import { writeAuditEvent } from '@/lib/audit/write-audit-event';
import { AUDIT_ACTIONS } from '@/lib/audit/types';

export type FinalizeOpts = {
  provider: string;
  merchantOrderId?: string;
  txId?: string;
  state?: string;
  providerResponse?: unknown;
};

export type FinalizeResult = {
  ok: boolean;
  idempotent?: boolean;
  inventoryError?: string;
  error?: string;
  orderId?: string;
};

type FinalizableOrder = HydratedDocument<IOrder>;

async function findOrderByMerchantOrTx(
  merchantOrderId?: string,
  txId?: string,
  providerResponse?: unknown,
): Promise<FinalizableOrder | null> {
  let order: FinalizableOrder | null = null;

  if (merchantOrderId) {
    try {
      order = await Order.findById(String(merchantOrderId));
    } catch {
      // ignore invalid id
    }
  }

  if (!order && txId) {
    order = await Order.findOne({ 'paymentInfo.transactionId': String(txId) });
  }

  if (!order && providerResponse) {
    try {
      const candidate = extractMerchantOrderIdFromProviderResponse(providerResponse);
      if (candidate) {
        order = await Order.findById(String(candidate));
      }

      if (!order) {
        order = await Order.findOne({
          'paymentInfo.razorpayOrderId': String(candidate || merchantOrderId || ''),
        });
      }
    } catch {
      // ignore lookup errors
    }
  }

  if (!order && merchantOrderId && String(merchantOrderId).startsWith('order_')) {
    try {
      order = await Order.findOne({
        'paymentInfo.razorpayOrderId': String(merchantOrderId),
      });
    } catch {
      // ignore
    }
  }

  return order;
}

export async function finalizeOrder(opts: FinalizeOpts): Promise<FinalizeResult> {
  const { provider, merchantOrderId, txId, state = '', providerResponse } = opts;

  await connectToDatabase();

  const order = await findOrderByMerchantOrTx(merchantOrderId, txId, providerResponse);

  if (!order) {
    console.warn('[payments][finalizeOrder] order not found for', { merchantOrderId, txId });
    return { ok: false, error: 'Order not found' };
  }

  const orderId = order._id.toString();
  const stateStr = String(state || '').toUpperCase().trim();

  if (
    stateStr === 'COMPLETED' ||
    stateStr === 'SUCCESS' ||
    stateStr === 'CAPTURED' ||
    stateStr === 'PAID'
  ) {
    return finalizeSuccessfulPayment(order, {
      provider,
      txId,
      orderId,
    });
  }

  if (
    stateStr === 'FAILED' ||
    stateStr === 'PAYMENT_FAILED' ||
    stateStr === 'FAILED_AUTH'
  ) {
    await finalizeFailedPayment(order, { txId, provider });
    return { ok: true, orderId };
  }

  if (stateStr === 'PENDING' || stateStr === 'PAYMENT_PENDING') {
    order.paymentInfo = order.paymentInfo || { method: 'cod', status: 'pending' };
    order.paymentInfo.status = 'pending';
    if (txId) order.paymentInfo.transactionId = txId;
    await order.save();
    console.info('[payments][finalizeOrder] set pending for', order._id);
    return { ok: true, orderId };
  }

  console.info('[payments][finalizeOrder] no action for state', stateStr, 'order=', order._id);
  return { ok: true, orderId };
}

async function finalizeSuccessfulPayment(
  order: FinalizableOrder,
  opts: { provider: string; txId?: string; orderId: string },
): Promise<FinalizeResult> {
  const { provider, txId, orderId } = opts;

  if (isPrepaidOrderFinalized(order)) {
    console.info('[payments][finalizeOrder] already finalized', orderId);
    void writeAuditEvent({
      action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
      orderId,
      metadata: {
        provider,
        transactionId: txId || order.paymentInfo?.transactionId,
        paymentStatus: 'completed',
        paymentMethod: order.paymentInfo?.method || provider,
        source: 'finalize_payment',
        idempotent: true,
      },
    });
    return { ok: true, idempotent: true, orderId };
  }

  if (
    order.status === 'cancelled' &&
    order.inventoryFailureReason &&
    order.paymentInfo?.status === 'completed'
  ) {
    return {
      ok: false,
      inventoryError: order.inventoryFailureReason,
      orderId,
      idempotent: true,
    };
  }

  const claim = await claimInventoryFinalizeLockWithRetry(orderId);
  if (!claim.claimed) {
    if (claim.reason === 'already_finalized') {
      void writeAuditEvent({
        action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
        orderId,
        metadata: {
          provider,
          transactionId: txId,
          paymentStatus: 'completed',
          paymentMethod: order.paymentInfo?.method || provider,
          source: 'finalize_payment',
          idempotent: true,
        },
      });
      return { ok: true, idempotent: true, orderId };
    }
    if (claim.reason === 'inventory_failed') {
      const failedOrder = claim.order;
      const inventoryFailureReason =
        failedOrder &&
        typeof failedOrder === 'object' &&
        'inventoryFailureReason' in failedOrder &&
        typeof (failedOrder as { inventoryFailureReason?: string }).inventoryFailureReason === 'string'
          ? (failedOrder as { inventoryFailureReason: string }).inventoryFailureReason
          : 'Insufficient stock for one or more items.';
      return {
        ok: false,
        inventoryError: inventoryFailureReason,
        orderId,
        idempotent: true,
      };
    }
    if (claim.reason === 'not_found') {
      return { ok: false, error: 'Order not found', orderId };
    }
    return { ok: false, error: 'Order finalize already in progress', orderId };
  }

  const lines = extractOrderInventoryLines(order);
  let inventoryResults: Awaited<ReturnType<typeof applyInventoryForOrderLines>> = [];
  const lockedOrder =
    claim.claimed && claim.order && typeof claim.order === 'object'
      ? (claim.order as { inventoryReservedAt?: Date; inventoryAdjusted?: boolean })
      : order;
  const alreadyReserved =
    Boolean(lockedOrder.inventoryReservedAt) && !lockedOrder.inventoryAdjusted;

  if (!alreadyReserved) {
    try {
      inventoryResults = await applyInventoryForOrderLines(lines, {
        orderId,
        source: 'payment_finalize',
      });
      await Order.findByIdAndUpdate(orderId, {
        $set: { inventoryReservedAt: new Date() },
      });
    } catch (invErr: unknown) {
      await rollbackInventoryAdjustments(inventoryResults, {
        orderId,
        source: 'payment_finalize_inventory_failure',
      });
      await releaseInventoryFinalizeLock(orderId);

      const inventoryError = getErrorMessage(
        invErr,
        'Insufficient stock for one or more items.',
      );

      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: 'cancelled',
          inventoryAdjusted: false,
          inventoryFinalizing: false,
          inventoryFailureReason: inventoryError,
          paidAt: order.paidAt || new Date(),
          'paymentInfo.status': 'completed',
          'paymentInfo.method': order.paymentInfo?.method || provider,
          ...(txId ? { 'paymentInfo.transactionId': txId } : {}),
        },
        $unset: { inventoryReservedAt: '' },
      });

      console.error('[payments][finalizeOrder] inventory adjustment failed', {
        orderId,
        inventoryError,
      });

      void writeAuditEvent({
        action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
        orderId,
        metadata: {
          provider,
          transactionId: txId,
          paymentStatus: 'completed',
          paymentMethod: order.paymentInfo?.method || provider,
          source: 'finalize_payment',
          state: 'inventory_failure_cancelled',
        },
      });

      return { ok: false, inventoryError, orderId };
    }

    try {
      const { sendLowInventoryAlert } = await import('@/lib/email-service');
      for (const result of inventoryResults) {
        if (result.updatedQty <= 10 && result.previousQty > 10) {
          await sendLowInventoryAlert({
            productName: result.productDoc.name || 'Unknown Product',
            productId: result.productDoc._id.toString(),
            currentQuantity: result.updatedQty,
            threshold: 10,
          });
        }
      }
    } catch (alertErr: unknown) {
      console.error(
        '[payments][finalizeOrder] low inventory alert failed',
        getErrorMessage(alertErr, 'alert failed'),
      );
    }
  }

  const orderNumber =
    order.orderNumber || 'INV-' + Date.now().toString(36).toUpperCase();
  const finalSnapshot = order.finalSnapshot || {
    items: order.orderItems || [],
    totalPrice: order.totalPrice,
    shippingAddress: order.shippingAddress,
  };

  const committed = await commitInventoryFinalize(orderId, {
    status: 'confirmed',
    orderNumber,
    finalSnapshot,
    paidAt: order.paidAt || new Date(),
    'paymentInfo.status': 'completed',
    'paymentInfo.method': order.paymentInfo?.method || provider,
    ...(txId ? { 'paymentInfo.transactionId': txId } : {}),
  });

  if (!committed) {
    if (!alreadyReserved && inventoryResults.length > 0) {
      await rollbackInventoryAdjustments(inventoryResults, {
        orderId,
        source: 'payment_finalize_commit_failed',
      });
    } else if (!alreadyReserved) {
      await clearInventoryReservation(orderId);
    }
    await releaseInventoryFinalizeLock(orderId);

    const current = await Order.findById(orderId).lean<OrderInventorySnapshot>();
    if (current && isPrepaidOrderFinalized(current)) {
      return { ok: true, idempotent: true, orderId };
    }

    console.error('[payments][finalizeOrder] failed to commit inventory finalize', orderId);
    return { ok: false, error: 'Could not commit order finalize', orderId };
  }

  const finalized = await Order.findById(orderId).lean<OrderInventorySnapshot>();
  if (finalized) {
    const consistency = verifyOrderInventoryConsistency(finalized);
    if (!consistency.valid) {
      console.error('[payments][finalizeOrder] inventory consistency check failed', {
        orderId,
        issues: consistency.issues,
      });
    }
  }

  try {
    const { sendPaymentConfirmationEmail } = await import('@/lib/email-service');

    let userEmail = order.customer?.email;
    if (!userEmail && order.user) {
      try {
        const User = require('@/models/User').default;
        const userDoc = await User.findById(order.user);
        if (userDoc?.email) userEmail = userDoc.email;
      } catch (lookupErr: unknown) {
        console.warn(
          '[payments][finalizeOrder] could not lookup user email',
          getErrorMessage(lookupErr, 'lookup failed'),
        );
      }
    }

    if (userEmail) {
      await sendPaymentConfirmationEmail({
        email: userEmail,
        orderId: orderNumber || order.orderId || orderId,
        transactionId: txId || order.paymentInfo?.transactionId,
        total: order.totalPrice || 0,
      });
    }
  } catch (mailErr: unknown) {
    console.error(
      '[payments][finalizeOrder] confirmation email error',
      getErrorMessage(mailErr, 'email failed'),
    );
  }

  console.info('[payments][finalizeOrder] finalized order', orderId);

  void writeAuditEvent({
    action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
    orderId,
    metadata: {
      provider,
      transactionId: txId || order.paymentInfo?.transactionId,
      paymentStatus: 'completed',
      paymentMethod: order.paymentInfo?.method || provider,
      source: 'finalize_payment',
    },
  });

  return { ok: true, orderId };
}

async function finalizeFailedPayment(order: FinalizableOrder, opts: { txId?: string; provider?: string }) {
  const { txId, provider } = opts;
  const orderId = order._id.toString();

  if (
    order.status === 'confirmed' &&
    order.paymentInfo?.status === 'completed'
  ) {
    console.info(
      '[payments][finalizeOrder] ignoring failed payment for finalized order',
      orderId,
    );
    return;
  }

  order.paymentInfo = order.paymentInfo || { method: 'cod', status: 'pending' };
  order.paymentInfo.status = 'failed';
  if (txId) order.paymentInfo.transactionId = txId;
  order.status = 'cancelled';

  try {
    await restoreInventoryWithClaim(orderId, {
      orderId,
      source: 'payment_failed',
    });
  } catch (invErr: unknown) {
    console.error(
      '[payments][finalizeOrder] inventory restore failed',
      getErrorMessage(invErr, 'restore failed'),
    );
  }

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      status: 'cancelled',
      inventoryFinalizing: false,
      'paymentInfo.status': 'failed',
      'paymentInfo.method': order.paymentInfo?.method || provider || 'cod',
      ...(txId ? { 'paymentInfo.transactionId': txId } : {}),
    },
  });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    let userEmail = order.customer?.email;
    if (!userEmail && order.user) {
      try {
        const User = require('@/models/User').default;
        const userDoc = await User.findById(order.user);
        if (userDoc?.email) userEmail = userDoc.email;
      } catch (lookupErr: unknown) {
        console.warn(
          '[payments][finalizeOrder] could not lookup user email',
          getErrorMessage(lookupErr, 'lookup failed'),
        );
      }
    }

    if (userEmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: `Payment Failed - ${order.orderNumber || ''}`,
        html: `<h2>Payment Failed</h2>
          <p>Your payment for order <b>${order.orderNumber || ''}</b> could not be completed.</p>
          <p>Please try again or contact support.</p>`,
      });
    }
  } catch (mailErr: unknown) {
    console.error(
      '[payments][finalizeOrder] failure email error',
      getErrorMessage(mailErr, 'email failed'),
    );
  }

  console.info('[payments][finalizeOrder] marked failed for', order._id);

  void writeAuditEvent({
    action: AUDIT_ACTIONS.PAYMENT_FAILED,
    orderId,
    metadata: {
      provider: provider || order.paymentInfo?.method,
      transactionId: txId || order.paymentInfo?.transactionId,
      paymentStatus: 'failed',
      paymentMethod: order.paymentInfo?.method,
      source: 'finalize_payment',
    },
  });
}
