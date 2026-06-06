export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { z } from 'zod';
import { isBlocked, recordFailedAttempt } from '@/lib/rateLimiter';


const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Password must include an uppercase letter')
    .regex(/(?=.*[a-z])/, 'Password must include a lowercase letter')
    .regex(/(?=.*\d)/, 'Password must include a number')
    .regex(/(?=.*[^A-Za-z0-9])/, 'Password must include a symbol'),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validation.data;

    // Basic rate limiting by IP to prevent mass registrations
    const xf = request.headers.get('x-forwarded-for');
    const ip = xf ? xf.split(',')[0].trim() : 'unknown';
    const ipKey = `register_ip_${ip}`;
    if (await isBlocked(ipKey)) {
      return NextResponse.json({ error: 'Too many registration attempts, try later' }, { status: 429 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user (password will be hashed by model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      emailVerified: false,
    });

    // Send verification email (best effort)
    try {
      const { createShortLivedToken } = await import('@/lib/auth');
      const token = await createShortLivedToken({ userId: user._id.toString(), action: 'verify-email' }, '1d');
      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const verifyUrl = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

      const { sendEmail } = await import('@/lib/email-service');
      await sendEmail({
        to: user.email,
        subject: 'Please verify your email',
        html: `Please click <a href="${verifyUrl}">here</a> to verify your email address. This link expires in 24 hours.`,
      });
    } catch (emailErr) {
      console.warn('Failed to send verification email', emailErr);
    }

    // Send marketing/welcome email if enabled (best effort, don't fail registration)
    try {
      const { sendMarketingEmail } = await import('@/lib/email-service');
      await sendMarketingEmail({
        email: user.email,
        name: user.name || 'Customer',
        isNewCustomer: true,
      });
    } catch (marketingErr) {
      console.warn('Failed to send marketing email', marketingErr);
      // Don't fail registration if marketing email fails
    }
    
    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // record failed registration attempt for rate limiting purposes
    try { await recordFailedAttempt(`register_ip_${request.headers.get('x-forwarded-for') || 'unknown'}`); } catch (e) {}

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}