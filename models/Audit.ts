import mongoose, { Schema, Document } from 'mongoose';

export type AuditInventoryChangeRecord = {
  productId?: string;
  quantityDelta?: number;
  previousQty?: number;
  updatedQty?: number;
};

export type AuditFieldChangeRecord = {
  field?: string;
  before?: unknown;
  after?: unknown;
};

export type AuditMetadataRecord = {
  provider?: string;
  transactionId?: string;
  paymentStatus?: string;
  inventoryChanges?: AuditInventoryChangeRecord[];
  productId?: string;
  quantityDelta?: number;
  paymentMethod?: string;
  source?: string;
  idempotent?: boolean;
  state?: string;
  orderPublicId?: string;
  targetUserId?: string;
  email?: string;
  role?: string;
  categorySlug?: string;
  name?: string;
  isActive?: boolean;
  slug?: string;
  category?: string;
  price?: number;
  quantity?: number;
  featured?: boolean;
  inStock?: boolean;
  adjustment?: number;
  before?: number;
  after?: number;
  changedFields?: AuditFieldChangeRecord[];
  categoryOrder?: string[];
};

export interface IAudit extends Document {
  adminId?: mongoose.Types.ObjectId | string;
  userId?: mongoose.Types.ObjectId | string;
  orderId?: mongoose.Types.ObjectId | string;
  action: string;
  before?: string;
  after?: string;
  reason?: string;
  metadata?: AuditMetadataRecord;
  createdAt: Date;
}

const inventoryChangeSchema = new Schema<AuditInventoryChangeRecord>(
  {
    productId: { type: String },
    quantityDelta: { type: Number },
    previousQty: { type: Number },
    updatedQty: { type: Number },
  },
  { _id: false },
);

const fieldChangeSchema = new Schema<AuditFieldChangeRecord>(
  {
    field: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const metadataSchema = new Schema<AuditMetadataRecord>(
  {
    provider: { type: String },
    transactionId: { type: String },
    paymentStatus: { type: String },
    inventoryChanges: { type: [inventoryChangeSchema], default: undefined },
    productId: { type: String },
    quantityDelta: { type: Number },
    paymentMethod: { type: String },
    source: { type: String },
    idempotent: { type: Boolean },
    state: { type: String },
    orderPublicId: { type: String },
    targetUserId: { type: String },
    email: { type: String },
    role: { type: String },
    categorySlug: { type: String },
    name: { type: String },
    isActive: { type: Boolean },
    slug: { type: String },
    category: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    featured: { type: Boolean },
    inStock: { type: Boolean },
    adjustment: { type: Number },
    before: { type: Number },
    after: { type: Number },
    changedFields: { type: [fieldChangeSchema], default: undefined },
    categoryOrder: { type: [String], default: undefined },
  },
  { _id: false },
);

const auditSchema = new Schema<IAudit>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: false },
    action: { type: String, required: true },
    before: { type: String },
    after: { type: String },
    reason: { type: String },
    metadata: { type: metadataSchema, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditSchema.index({ orderId: 1 });
auditSchema.index({ adminId: 1 });
auditSchema.index({ userId: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ createdAt: -1 });
auditSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.models.Audit || mongoose.model<IAudit>('Audit', auditSchema);
