import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { encrypt } from '@/lib/auth';
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

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await encrypt({ userId: user._id.toString(), role: user.role });

    const isProd = process.env.NODE_ENV === 'production';

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

    // ✅ Attach cookie BEFORE returning
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',    // safer default
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Add a tiny debug header so we can confirm the server attached a cookie in production
    try {
      response.headers.set('x-debug-cookie-set', `${token.slice(0, 8)}...`);
      response.headers.set('x-debug-cookie-options', JSON.stringify({ secure: isProd, sameSite: 'lax' }));
    } catch (e) {
      // ignore header set errors
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
