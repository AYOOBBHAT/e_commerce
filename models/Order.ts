import mongoose, { Schema, Document } from 'mongoose';
import { IAddress } from './User';

interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface IPaymentInfo {
  method: 'phonepe' | 'razorpay' | 'cashfree' | 'cod';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface IOrder extends Document {
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
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  // Final order bookkeeping
  paidAt?: Date;
  orderNumber?: string;
  inventoryAdjusted?: boolean;
  finalSnapshot?: any;
  isProductionTest?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String },
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
    finalSnapshot: { type: Object },
    isProductionTest: { type: Boolean, default: false },
    // Guest customer contact information (if user is not logged in)
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    totalPrice: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);