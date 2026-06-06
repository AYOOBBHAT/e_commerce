import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  maintenanceMode: boolean;
  paymentMethods: {
    phonepe: boolean;
    razorpay: boolean;
    cashfree: boolean;
    cod: boolean;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultRate: number;
  };
  notifications: {
    orderConfirmation: boolean;
    shippingUpdates: boolean;
    lowInventory: boolean;
    marketing: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: 'ZeeShaEla & Co.' },
    storeEmail: { type: String, default: 'support@zeeshaela.com' },
    storePhone: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    paymentMethods: {
      phonepe: { type: Boolean, default: true },
      razorpay: { type: Boolean, default: true },
      cashfree: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 2000 },
      defaultRate: { type: Number, default: 0 },
    },
    notifications: {
      orderConfirmation: { type: Boolean, default: true },
      shippingUpdates: { type: Boolean, default: true },
      lowInventory: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
settingsSchema.statics.getOrCreate = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;

