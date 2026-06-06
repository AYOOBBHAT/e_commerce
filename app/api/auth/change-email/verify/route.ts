import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from '@/lib/auth';
import { otpStore } from '../request/route';

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

    const { newEmail, otp } = await request.json();
    if (!newEmail || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored OTP
    const stored = otpStore.get(session.userId);
    if (!stored) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(session.userId);
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (stored.otp !== otp || stored.newEmail !== newEmail) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Update user email
    await User.findByIdAndUpdate(session.userId, { email: newEmail });

    // Clear OTP
    otpStore.delete(session.userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Email updated successfully' 
    });
  } catch (error) {
    console.error('Error verifying email change:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}

