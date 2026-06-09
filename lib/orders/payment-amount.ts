import { connectToDatabase } from '@/lib/db'
import Order from '@/models/Order'
import { roundMoney } from '@/lib/shipping'

type PaymentAmountResult =
  | { ok: true; amount: number }
  | { ok: false; error: string; status: number }

export async function resolveOrderPaymentAmount(
  orderId: string,
  clientAmount?: number,
): Promise<PaymentAmountResult> {
  await connectToDatabase()

  const order = await Order.findById(String(orderId).trim())
  if (!order) {
    return { ok: false, error: 'Order not found', status: 404 }
  }

  const amount = roundMoney(order.totalPrice)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Invalid order total', status: 400 }
  }

  if (
    clientAmount != null &&
    Math.abs(roundMoney(Number(clientAmount)) - amount) > 0.01
  ) {
    return {
      ok: false,
      error: 'Payment amount does not match order total',
      status: 400,
    }
  }

  return { ok: true, amount }
}
