import Order from '@/models/Order';
import { connectToDatabase } from './db';
import nodemailer from 'nodemailer';
import { restoreInventoryForOrder } from '@/lib/orders/inventory-restore';
import {
  applyInventoryForOrderLines,
  claimInventoryFinalizeLockWithRetry,
  commitInventoryFinalize,
  extractOrderInventoryLines,
  releaseInventoryFinalizeLock,
  rollbackInventoryAdjustments,
} from '@/lib/orders/inventory-apply';
import {
  isPrepaidOrderFinalized,
  verifyOrderInventoryConsistency,
  type OrderInventorySnapshot,
} from '@/lib/orders/inventory-consistency';

export type FinalizeOpts = {
  provider: string;
  merchantOrderId?: string;
  txId?: string;
  state?: string;
  providerResponse?: any;
};

export type FinalizeResult = {
  ok: boolean;
  idempotent?: boolean;
  inventoryError?: string;
  error?: string;
  orderId?: string;
};

export async function finalizeOrder(opts: FinalizeOpts): Promise<FinalizeResult> {
  const { provider, merchantOrderId, txId, state = '', providerResponse } = opts;

  await connectToDatabase();

  let order = null as any;
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

  try {
    if (!order && providerResponse) {
      const resp = providerResponse;
      const candidate =
        resp?.data?.merchantOrderId ||
        resp?.data?.merchantTransactionId ||
        resp?.data?.order_id ||
        resp?.order_id ||
        resp?.merchantTransactionId ||
        resp?.merchantOrderId ||
        resp?.merchant_order_id;
      if (candidate) {
        order = await Order.findById(String(candidate));
      }

      const rzpCandidate =
        resp?.payload?.payment?.entity?.order_id ||
        resp?.payload?.payment?.entity?.orderId ||
        resp?.payment?.order_id ||
        resp?.order_id;
      if (!order && rzpCandidate) {
        order = await Order.findOne({
          'paymentInfo.razorpayOrderId': String(rzpCandidate),
        });
      }
    }
  } catch {
    // ignore lookup errors
  }

  try {
    if (!order && merchantOrderId && String(merchantOrderId).startsWith('order_')) {
      order = await Order.findOne({
        'paymentInfo.razorpayOrderId': String(merchantOrderId),
      });
    }
  } catch {
    // ignore
  }

  if (!order) {
    console.warn('[payments][finalizeOrder] order not found for', { merchantOrderId, txId });
    return { ok: false, error: 'Order not found' };
  }

  const orderId = order._id.toString();
  const stateStr = String((state || '').toUpperCase()).trim();

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
    await finalizeFailedPayment(order, { txId });
    return { ok: true, orderId };
  }

  if (stateStr === 'PENDING' || stateStr === 'PAYMENT_PENDING') {
    order.paymentInfo = order.paymentInfo || {};
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
  order: any,
  opts: { provider: string; txId?: string; orderId: string },
): Promise<FinalizeResult> {
  const { provider, txId, orderId } = opts;

  if (isPrepaidOrderFinalized(order)) {
    console.info('[payments][finalizeOrder] already finalized', orderId);
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
      return { ok: true, idempotent: true, orderId };
    }
    if (claim.reason === 'inventory_failed') {
      return {
        ok: false,
        inventoryError:
          (claim.order as { inventoryFailureReason?: string })?.inventoryFailureReason ||
          'Insufficient stock for one or more items.',
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
  const alreadyReserved = Boolean(order.inventoryReservedAt) && !order.inventoryAdjusted;

  if (!alreadyReserved) {
    try {
      inventoryResults = await applyInventoryForOrderLines(lines);
      await Order.findByIdAndUpdate(orderId, {
        $set: { inventoryReservedAt: new Date() },
      });
    } catch (invErr: any) {
      await rollbackInventoryAdjustments(inventoryResults);
      await releaseInventoryFinalizeLock(orderId);

      const inventoryError =
        invErr?.message || 'Insufficient stock for one or more items.';

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
    } catch (alertErr) {
      console.error('[payments][finalizeOrder] low inventory alert failed', alertErr);
    }
  }

  const orderNumber =
    order.orderNumber || 'INV-' + Date.now().toString(36).toUpperCase();
  const finalSnapshot = order.finalSnapshot || {
    items: order.orderItems || order.items || [],
    totalPrice: order.totalPrice || order.total,
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
    if (!alreadyReserved) {
      await rollbackInventoryAdjustments(inventoryResults);
    }
    await releaseInventoryFinalizeLock(orderId);

    const current = (await Order.findById(orderId).lean()) as OrderInventorySnapshot | null;
    if (current && isPrepaidOrderFinalized(current)) {
      return { ok: true, idempotent: true, orderId };
    }

    console.error('[payments][finalizeOrder] failed to commit inventory finalize', orderId);
    return { ok: false, error: 'Could not commit order finalize', orderId };
  }

  const finalized = (await Order.findById(orderId).lean()) as OrderInventorySnapshot | null;
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
      } catch (lookupErr) {
        console.warn('[payments][finalizeOrder] could not lookup user email', lookupErr);
      }
    }

    if (userEmail) {
      await sendPaymentConfirmationEmail({
        email: userEmail,
        orderId: orderNumber || order.orderId || orderId,
        transactionId: txId || order.paymentInfo?.transactionId,
        total: order.totalPrice || order.total || 0,
      });
    }
  } catch (mailErr) {
    console.error('[payments][finalizeOrder] confirmation email error', mailErr);
  }

  console.info('[payments][finalizeOrder] finalized order', orderId);
  return { ok: true, orderId };
}

async function finalizeFailedPayment(order: any, opts: { txId?: string }) {
  const { txId } = opts;

  order.paymentInfo = order.paymentInfo || {};
  order.paymentInfo.status = 'failed';
  if (txId) order.paymentInfo.transactionId = txId;
  order.status = 'cancelled';

  if (order.inventoryAdjusted) {
    try {
      await restoreInventoryForOrder(order);
      order.inventoryAdjusted = false;
    } catch (invErr) {
      console.error('[payments][finalizeOrder] inventory restore failed', invErr);
    }
  }

  order.inventoryFinalizing = false;
  await order.save();

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
      } catch (lookupErr) {
        console.warn('[payments][finalizeOrder] could not lookup user email', lookupErr);
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
  } catch (mailErr) {
    console.error('[payments][finalizeOrder] failure email error', mailErr);
  }

  console.info('[payments][finalizeOrder] marked failed for', order._id);
}
