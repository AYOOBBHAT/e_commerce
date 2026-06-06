import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { encrypt } from '@/lib/auth';
import { setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT || `${base}/api/auth/google/callback`;

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieState = request.cookies.get('oauth_state')?.value;

    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    if (!state || !cookieState || state !== cookieState) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: String(GOOGLE_CLIENT_ID),
        client_secret: String(GOOGLE_CLIENT_SECRET),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      } as any) as any,
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[auth][google] token exchange failed', err);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user info
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    if (!profile || !profile.email) {
      return NextResponse.json({ error: 'Failed to retrieve user profile from Google' }, { status: 500 });
    }

    // Reject if Google did not verify the email
    if (profile.email_verified !== true) {
      return NextResponse.json({ error: 'Google email is not verified' }, { status: 403 });
    }

    await connectToDatabase();

    // Find existing user
    let user = await User.findOne({ email: profile.email });

    if (user) {
      // If user has a googleId, it must match the incoming one
      if (user.googleId && user.googleId !== profile.sub) {
        return NextResponse.json({ error: 'This email is linked to a different Google account' }, { status: 403 });
      }

      // Attach googleId if not already present
      if (!user.googleId) {
        user.googleId = profile.sub;
        user.emailVerified = true;
        // preserve existing provider (likely 'credentials') but allow googleId to be attached
        await user.save();
      }
    } else {
      // Create new user (no password for OAuth users)
      user = await User.create({
        name: profile.name || profile.email,
        email: profile.email,
        password: null,
        emailVerified: true,
        googleId: profile.sub,
        provider: 'google',
      });
    }

    // Create JWT with userId, role and email
    const token = await encrypt({ userId: user._id.toString(), role: user.role, email: user.email });
    const response = NextResponse.redirect(`${base}/`);

    // Set auth cookie (helper sets secure/httpOnly/sameSite=lax)
    setAuthCookie(response, token);

    // Clear oauth_state cookie
    response.cookies.set({ name: 'oauth_state', value: '', expires: new Date(0), path: '/', httpOnly: true });

    return response;
  } catch (err: any) {
    console.error('[auth][google][callback] error', err);
    return NextResponse.json({ error: 'Google callback failed' }, { status: 500 });
  }
}