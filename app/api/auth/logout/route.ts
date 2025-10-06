import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

  const response = NextResponse.json({ message: 'Logged out successfully' }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Surrogate-Control': 'no-store' } });

    // Clear cookie by setting expired cookie on the response
    const cookieOpts: Record<string, any> = {
      name: 'token',
      value: '',
      httpOnly: true,
      secure: isProd,
      expires: new Date(0),
      path: '/',
      sameSite: COOKIE_SAME_SITE as any,
    };
    if (COOKIE_DOMAIN) cookieOpts.domain = COOKIE_DOMAIN;

    response.cookies.set(cookieOpts as any);
    try {
      response.headers.set('x-debug-cookie-cleared', '1');
      response.headers.set('x-debug-cookie-options', JSON.stringify(cookieOpts));
    } catch (e) {
      // ignore
    }
  return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}