import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "@/models/OTP";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import { z } from "zod";
import { getClientIp } from '@/lib/client-ip';
import {
  isBlockedScope,
  recordScopeAttempt,
} from '@/lib/rateLimiter';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    await connectToDatabase();
    
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      await recordScopeAttempt('forgot', ip);
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { email } = validation.data;

    if (await isBlockedScope('forgot', ip, email)) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 },
      );
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      await recordScopeAttempt('forgot', ip, email);
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset code.'
      });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    
    // Save new OTP
    await OTP.create({
      email,
      otp: hashedOTP,
    });
    
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Email template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
  subject: 'Password Reset Code - ZeeShaEla & Co.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">ZeeShaEla & Co.</h1>
            <h2 style="color: #666; font-weight: normal;">Password Reset Request</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #333;">Hello,</p>
            <p style="margin: 0 0 15px 0; color: #333;">
              We received a request to reset your password for your ZeeShaEla & Co. account.
            </p>
            <p style="margin: 0 0 15px 0; color: #333;">
              Your password reset code is:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; padding: 15px 25px; background-color: #e7f3ff; border-radius: 8px; display: inline-block;">
                ${otp}
              </span>
            </div>
            <p style="margin: 0 0 15px 0; color: #333;">
              This code will expire in 5 minutes for security reasons.
            </p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            <p>© 2025 ZeeShaEla & Co. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    
    // Send email
    await transporter.sendMail(mailOptions);

    await recordScopeAttempt('forgot', ip, email);
    
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    try {
      await recordScopeAttempt('forgot', ip);
    } catch (e) {
      console.warn('[forgot-password] rate limit record failed', e);
    }
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}