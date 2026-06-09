import type { ValidatedOrder } from '@/lib/cart/types';

export type OrderCreateInput = {
  orderId: string;
  idempotencyKey: string;
  user?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: unknown;
  orderItems: ValidatedOrder['orderItems'];
  subtotal: number;
  shippingAmount: number;
  freeShippingApplied: boolean;
  shippingThresholdUsed: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  inventoryAdjusted: boolean;
};

export function buildOrderCreatePayload(input: OrderCreateInput) {
  return {
    orderId: input.orderId,
    idempotencyKey: input.idempotencyKey,
    user: input.user,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    items: input.orderItems,
    orderItems: input.orderItems,
    subtotal: input.subtotal,
    shippingAmount: input.shippingAmount,
    freeShippingApplied: input.freeShippingApplied,
    shippingThresholdUsed: input.shippingThresholdUsed,
    total: input.total,
    totalPrice: input.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    paymentInfo: {
      method: input.paymentMethod,
      status: 'pending' as const,
    },
    status: 'pending' as const,
    inventoryAdjusted: input.inventoryAdjusted,
  };
}
