import mongoose, { Schema, Document } from 'mongoose';
import { IAddress } from './User';

interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface IPaymentInfo {
  method: 'razorpay' | 'paytm' | 'cod';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  shippingAddress: IAddress;
  paymentInfo: IPaymentInfo;
  totalPrice: number;
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentInfo: {
      method: { type: String, enum: ['razorpay', 'paytm', 'cod'], required: true },
      transactionId: { type: String },
      status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    },
    totalPrice: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
      default: 'processing' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);