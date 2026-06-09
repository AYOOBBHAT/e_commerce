import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { encrypt, setAuthCookie } from '@/lib/auth';
import { isBlocked, recordFailedAttempt, resetAttempts, isBlockedComposite, recordFailedAttemptComposite, resetAttemptsComposite } from '@/lib/rateLimiter';
import { getClientIp } from '@/lib/client-ip';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Determine client IP for rate-limiting purposes
    const ip = getClientIp(request);
    const ipKey = `login_ip_${ip}`;
    const emailKey = `login_email_${email}`;

    // Check combined blocking rules (per-ip, per-account, and their combo)
    if (await isBlockedComposite(ip, email)) {
      return NextResponse.json({ error: 'Too many failed login attempts, please try again later' }, { status: 429 });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      // record failed attempts per ip + account combo
      await recordFailedAttemptComposite(ip, email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Reset attempts on successful login
    await resetAttemptsComposite(ip, email);

    const token = await encrypt({ userId: user._id.toString(), role: user.role });

    // Build the response first
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Surrogate-Control': 'no-store' } });

    // Use helper to set cookie
    setAuthCookie(response, token);

    try {
      response.headers.set('x-debug-cookie-set', `${token.slice(0, 8)}...`);
    } catch (e) {
      // ignore header set errors
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
