import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from '@/lib/auth';
import crypto from 'crypto';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number; newEmail: string }>();

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newEmail } = await request.json();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(session.userId, { otp, expiresAt, newEmail });

    // In production, send email with OTP
    console.log(`OTP for ${newEmail}: ${otp}`); // Remove in production

    // TODO: Send email with OTP using nodemailer or similar
    // await sendOTPEmail(newEmail, otp);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent to your new email address' 
    });
  } catch (error) {
    console.error('Error requesting email change:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

// Export otpStore for verification endpoint
export { otpStore };

