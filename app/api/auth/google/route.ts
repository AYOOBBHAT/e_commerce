import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT || `${base}/api/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    const state = encodeURIComponent(Date.now().toString(36) + Math.random().toString(36).slice(2));
    // For simplicity we set a short-lived cookie with state to validate on callback
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&response_type=code&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    );

    response.cookies.set({ name: 'oauth_state', value: state, maxAge: 300, path: '/', httpOnly: true });
    return response;
  } catch (err: any) {
    console.error('[auth][google] error', err);
    return NextResponse.json({ error: 'Google auth failed' }, { status: 500 });
  }
}