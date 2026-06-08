import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  slug: string
  name: string
  image: string
  imageAlt: string
  sortOrder: number
  isActive: boolean
  hideWhenEmpty: boolean
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    imageAlt: { type: String, required: true, default: '' },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    hideWhenEmpty: { type: Boolean, default: true },
  },
  { timestamps: true },
)

categorySchema.index({ isActive: 1, sortOrder: 1 })

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', categorySchema)
