import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true }, // store hashed OTP
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes
});

// TTL Index
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model("OTP", otpSchema);
