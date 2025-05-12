import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  inStock: boolean;
  quantity: number;
  featured: boolean;
  ratings: {
    userId: mongoose.Types.ObjectId;
    rating: number;
    review?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    images: [{ type: String, required: true }],
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    ratings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Create text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);