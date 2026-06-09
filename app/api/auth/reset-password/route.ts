import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import OTP from "@/models/OTP";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { z } from "zod";
import { getClientIp } from '@/lib/client-ip';
import {
  isBlocked,
  isBlockedScope,
  recordFailedAttempt,
  recordScopeAttempt,
  scopeEmailKey,
} from '@/lib/rateLimiter';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    await connectToDatabase();
    
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      await recordScopeAttempt('reset', ip);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { email, otp, newPassword } = validation.data;

    if (await isBlockedScope('reset', ip, email)) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const otpKey = scopeEmailKey('reset_otp', email);
    if (await isBlocked(otpKey)) {
      return NextResponse.json(
        { error: 'Too many invalid OTP attempts. Please request a new code.' },
        { status: 429 },
      );
    }
    
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      await recordScopeAttempt('reset', ip, email);
      await recordFailedAttempt(otpKey);
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOTPValid) {
      await recordScopeAttempt('reset', ip, email);
      await recordFailedAttempt(otpKey);
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      await recordScopeAttempt('reset', ip, email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ email });
    
    return NextResponse.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    try {
      await recordScopeAttempt('reset', ip);
    } catch (e) {
      console.warn('[reset-password] rate limit record failed', e);
    }
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
