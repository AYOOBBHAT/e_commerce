import Order from '@/models/Order';
import Product from '@/models/Product';
import { connectToDatabase } from './db';
import nodemailer from 'nodemailer';

export type FinalizeOpts = {
  provider: string;
  merchantOrderId?: string; // our Order._id or custom merchant id
  txId?: string; // provider transaction id / payment id
  state?: string; // 'COMPLETED' | 'FAILED' | 'PENDING' etc
  providerResponse?: any;
};

export async function finalizeOrder(opts: FinalizeOpts) {
  const { provider, merchantOrderId, txId, state = '', providerResponse } = opts;

  await connectToDatabase();

  // Try to find order by _id first
  let order = null as any;
  if (merchantOrderId) {
    try {
      order = await Order.findById(String(merchantOrderId));
    } catch (e) {
      // ignore
    }
  }

  // Fallback: try to find order by paymentInfo.transactionId
  if (!order && txId) {
    order = await Order.findOne({ 'paymentInfo.transactionId': String(txId) });
  }

  // Fallback: providerResponse mapping helpers
  try {
    if (!order && providerResponse) {
      // Try common shapes
      const resp = providerResponse;
      // PhonePe / Cashfree style may include merchantTransactionId / orderId
      const candidate = resp?.data?.merchantOrderId || resp?.data?.merchantTransactionId || resp?.data?.order_id || resp?.order_id || resp?.merchantTransactionId || resp?.merchantOrderId || resp?.merchant_order_id;
      if (candidate) {
        order = await Order.findById(String(candidate));
      }

      // Razorpay specific: payload.payment.entity.order_id
      const rzpCandidate = resp?.payload?.payment?.entity?.order_id || resp?.payload?.payment?.entity?.orderId || resp?.payment?.order_id || resp?.order_id;
      if (!order && rzpCandidate) {
        order = await Order.findOne({ 'paymentInfo.razorpayOrderId': String(rzpCandidate) });
      }
    }
  } catch (e) {
    // ignore
  }

  // Additional fallback: if merchantOrderId itself is a Razorpay order id (starts with 'order_') try mapping
  try {
    if (!order && merchantOrderId && String(merchantOrderId).startsWith('order_')) {
      order = await Order.findOne({ 'paymentInfo.razorpayOrderId': String(merchantOrderId) });
    }
  } catch (e) {
    // ignore
  }

  if (!order) {
    console.warn('[payments][finalizeOrder] order not found for', { merchantOrderId, txId });
    return;
  }

  const stateStr = String((state || '').toUpperCase()).trim();

  // Success states
  if (stateStr === 'COMPLETED' || stateStr === 'SUCCESS' || stateStr === 'CAPTURED' || stateStr === 'PAID') {
    if (order.paymentInfo?.status === 'completed' && order.inventoryAdjusted && order.paidAt) {
      console.info('[payments][finalizeOrder] already finalized', order._id);
      return;
    }

    order.paymentInfo = order.paymentInfo || {};
    order.paymentInfo.method = order.paymentInfo?.method || provider;
    if (txId) order.paymentInfo.transactionId = txId;
    order.paymentInfo.status = 'completed';
    order.paidAt = order.paidAt || new Date();

    if (!order.orderNumber) {
      order.orderNumber = 'INV-' + Date.now().toString(36).toUpperCase();
    }

    order.finalSnapshot = order.finalSnapshot || {
      items: order.orderItems || order.items || [],
      totalPrice: order.totalPrice || order.total,
      shippingAddress: order.shippingAddress,
    };

    // Inventory adjustment
    if (!order.inventoryAdjusted) {
      try {
        const { sendLowInventoryAlert } = await import('@/lib/email-service');
        
        for (const it of (order.orderItems || order.items || [])) {
          if (!it?.product) continue;
          const productDoc = await Product.findById(it.product);
          if (!productDoc) continue;
          const currentQty = typeof productDoc.quantity === 'number' ? productDoc.quantity : 0;
          const reduceBy = Number(it.quantity || 0);
          const updated = Math.max(0, currentQty - reduceBy);
          productDoc.quantity = updated;
          productDoc.inStock = updated > 0;
          await productDoc.save();

          // Check for low inventory alert
          if (updated <= 10 && currentQty > 10) {
            await sendLowInventoryAlert({
              productName: productDoc.name || 'Unknown Product',
              productId: productDoc._id.toString(),
              currentQuantity: updated,
              threshold: 10,
            });
          }
        }
        order.inventoryAdjusted = true;
      } catch (invErr) {
        console.error('[payments][finalizeOrder] inventory adjustment failed', invErr);
      }
    }

    order.status = 'confirmed';
    await order.save();

    // Send payment confirmation email (best-effort)
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
          orderId: order.orderNumber || order.orderId || order._id.toString(),
          transactionId: order.paymentInfo?.transactionId,
          total: order.totalPrice || order.total || 0,
        });
      } else {
        console.warn('[payments][finalizeOrder] no customer email available to send confirmation');
      }
    } catch (mailErr) {
      console.error('[payments][finalizeOrder] confirmation email error', mailErr);
    }

    console.info('[payments][finalizeOrder] finalized order', order._id);
    return;
  }

  // Failed states
  if (stateStr === 'FAILED' || stateStr === 'PAYMENT_FAILED' || stateStr === 'FAILED_AUTH') {
    order.paymentInfo = order.paymentInfo || {};
    order.paymentInfo.status = 'failed';
    if (txId) order.paymentInfo.transactionId = txId;
    order.status = 'cancelled';

    if (order.inventoryAdjusted) {
      try {
        for (const it of (order.orderItems || order.items || [])) {
          if (!it?.product) continue;
          const productDoc = await Product.findById(it.product);
          if (!productDoc) continue;
          const currentQty = typeof productDoc.quantity === 'number' ? productDoc.quantity : 0;
          const updated = currentQty + Number(it.quantity || 0);
          productDoc.quantity = updated;
          productDoc.inStock = updated > 0;
          await productDoc.save();
        }
        order.inventoryAdjusted = false;
      } catch (invErr) {
        console.error('[payments][finalizeOrder] inventory restore failed', invErr);
      }
    }

    await order.save();

    // Send failure notification
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
    return;
  }

  // Pending or other
  if (stateStr === 'PENDING' || stateStr === 'PAYMENT_PENDING') {
    order.paymentInfo = order.paymentInfo || {};
    order.paymentInfo.status = 'pending';
    if (txId) order.paymentInfo.transactionId = txId;
    await order.save();
    console.info('[payments][finalizeOrder] set pending for', order._id);
    return;
  }

  console.info('[payments][finalizeOrder] no action for state', stateStr, 'order=', order._id);
}
