import mongoose, { Schema, Document } from 'mongoose';

export interface IAudit extends Document {
  adminId: mongoose.Types.ObjectId | string;
  orderId: mongoose.Types.ObjectId | string;
  action: string;
  before?: string;
  after?: string;
  reason?: string;
  createdAt: Date;
}

const auditSchema = new Schema<IAudit>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    action: { type: String, required: true },
    before: { type: String },
    after: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for performance: query by orderId, adminId, action and createdAt ranges
auditSchema.index({ orderId: 1 });
auditSchema.index({ adminId: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ createdAt: -1 });

export default mongoose.models.Audit || mongoose.model<IAudit>('Audit', auditSchema);
