import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string | null;
  provider: 'credentials' | 'google';
  emailVerified?: boolean;
  googleId?: string;
  phone?: string;
  role: 'user' | 'admin';
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false, default: null },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    emailVerified: { type: Boolean, default: false },
    googleId: { type: String },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

// Hash the password before saving (only if a password is present and was modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  // If password is not set (e.g., OAuth user) or provider is google, disallow password comparison
  if (!this.password) return false;
  try {
    return await bcrypt.compare(password, this.password);
  } catch (err) {
    return false;
  }
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);