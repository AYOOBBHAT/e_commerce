import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  slug: string
  name: string
  image: string
  imagePublicId?: string
  imageAlt: string
  /** Reserved for future hero / PLP banners — not used in Phase 1 */
  heroImage?: string
  heroImagePublicId?: string
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
    imagePublicId: { type: String, default: '', trim: true },
    imageAlt: { type: String, required: true, default: '' },
    heroImage: { type: String, default: '', trim: true },
    heroImagePublicId: { type: String, default: '', trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    hideWhenEmpty: { type: Boolean, default: true },
  },
  { timestamps: true },
)

categorySchema.index({ isActive: 1, sortOrder: 1 })

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', categorySchema)
