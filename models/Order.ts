import mongoose, { Schema, Document } from 'mongoose';
import { IAddress } from './User';

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variantLabel?: string;
}

interface IPaymentInfo {
  method: 'phonepe' | 'razorpay' | 'cashfree' | 'cod';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface IOrder extends Document {
  orderId?: string;
  user?: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  // Guest contact info
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress: any;
  paymentInfo: IPaymentInfo;
  totalPrice: number;
  subtotal?: number;
  shippingAmount?: number;
  freeShippingApplied?: boolean;
  shippingThresholdUsed?: number;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  // Final order bookkeeping
  paidAt?: Date;
  orderNumber?: string;
  inventoryAdjusted?: boolean;
  inventoryFinalizing?: boolean;
  inventoryReservedAt?: Date;
  inventoryRestoring?: boolean;
  inventoryRestoreClaimedAt?: Date;
  inventoryRestoreStockApplied?: boolean;
  inventoryFailureReason?: string;
  finalSnapshot?: any;
  isProductionTest?: boolean;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, sparse: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
        variantLabel: { type: String },
      },
    ],
    shippingAddress: { type: Schema.Types.Mixed, required: true },

    paymentInfo: {
      method: { type: String, enum: ['phonepe', 'razorpay', 'cashfree', 'cod'], required: true },
      transactionId: { type: String },
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    },
    // Final order snapshot and bookkeeping
    paidAt: { type: Date },
    orderNumber: { type: String },
    inventoryAdjusted: { type: Boolean, default: false },
    inventoryFinalizing: { type: Boolean, default: false },
    inventoryReservedAt: { type: Date },
    inventoryRestoring: { type: Boolean, default: false },
    inventoryRestoreClaimedAt: { type: Date },
    inventoryRestoreStockApplied: { type: Boolean, default: false },
    inventoryFailureReason: { type: String },
    finalSnapshot: { type: Object },
    isProductionTest: { type: Boolean, default: false },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    // Guest customer contact information (if user is not logged in)
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    totalPrice: { type: Number, required: true },
    subtotal: { type: Number },
    shippingAmount: { type: Number, default: 0 },
    freeShippingApplied: { type: Boolean, default: false },
    shippingThresholdUsed: { type: Number, default: 0 },
    status: {
      type: String, 
      enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);