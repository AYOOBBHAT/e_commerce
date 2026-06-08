import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  unitLabel?: string;
  variants?: {
    label: string;
    price: number;
    comparePrice?: number;
    inStock?: boolean;
  }[];
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
  imageMeta?: {
    url: string;
    status: 'draft' | 'needs_review' | 'approved' | 'featured_ready';
    scores?: {
      lighting: number;
      composition: number;
      colorGrading: number;
      brandFit: number;
    };
    consistencyScore?: number;
    validationErrors: string[];
    validationWarnings: string[];
    width?: number;
    height?: number;
    analyzedAt?: Date;
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
    unitLabel: { type: String, default: '' },
    variants: [
      {
        label: { type: String, required: true },
        price: { type: Number, required: true },
        comparePrice: { type: Number },
        inStock: { type: Boolean, default: true },
      },
    ],
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
    imageMeta: [
      {
        url: { type: String, required: true },
        status: {
          type: String,
          enum: ['draft', 'needs_review', 'approved', 'featured_ready'],
          default: 'needs_review',
        },
        scores: {
          lighting: Number,
          composition: Number,
          colorGrading: Number,
          brandFit: Number,
        },
        consistencyScore: Number,
        validationErrors: [{ type: String }],
        validationWarnings: [{ type: String }],
        width: Number,
        height: Number,
        analyzedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Create text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ featured: 1, inStock: 1 });
productSchema.index({ quantity: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);