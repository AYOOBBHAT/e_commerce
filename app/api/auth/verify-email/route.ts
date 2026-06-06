import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL((request as any).url);
    const token = url.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const payload = await decrypt(String(token));
    if (!payload || payload.action !== 'verify-email' || !payload.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(String(payload.userId));
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.emailVerified = true;
    await user.save();

    // Redirect to login with success message
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${base}/login?verified=1`);
  } catch (err: any) {
    console.error('[auth][verify-email] error', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}