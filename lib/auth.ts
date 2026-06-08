import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

// Cookie defaults - safer defaults for both dev and prod
const isProd = process.env.NODE_ENV === 'production';
// default to 'lax' which works for same-site and most login flows; allow override with env var
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';

function isCustomDomain(domain?: string) {
  return !!domain && domain.includes('.') && !domain.endsWith('.vercel.app');
}

const COOKIE_DOMAIN = isCustomDomain(process.env.COOKIE_DOMAIN)
  ? process.env.COOKIE_DOMAIN
  : undefined;

const defaultCookieOptions: Record<string, any> = {
  httpOnly: true,
  secure: isProd,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  sameSite: COOKIE_SAME_SITE,
};

if (COOKIE_DOMAIN) {
  defaultCookieOptions.domain = COOKIE_DOMAIN;
}

// Warn when SameSite=none is used but secure isn't enabled (this will be rejected by browsers)
if (defaultCookieOptions.sameSite === 'none' && !defaultCookieOptions.secure) {
  console.warn(
    'Warning: COOKIE_SAME_SITE is set to none but secure flag is false. Cookies with SameSite=none require Secure=true and will be rejected by browsers when not using HTTPS.'
  );
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function createShortLivedToken(payload: any, expires: string = '1d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

/** Refresh JWT only when within 24h of expiry — avoids re-signing on every request */
export function shouldRefreshToken(payload: Record<string, unknown>): boolean {
  const exp = payload.exp;
  if (typeof exp !== 'number') return true;
  const refreshThresholdMs = 24 * 60 * 60 * 1000;
  return exp * 1000 - Date.now() < refreshThresholdMs;
}

export async function refreshAuthToken(payload: Record<string, unknown>) {
  return encrypt({
    userId: payload.userId,
    role: payload.role,
  });
}

export async function login(userId: string, role: string) {
  const token = await encrypt({ userId, role });
  return token;
}

/**
 * Helper to set auth cookie on a NextResponse
 */
export function setAuthCookie(response: NextResponse, token: string) {
  const cookieOpts: Record<string, any> = {
    name: 'token',
    value: token,
    httpOnly: defaultCookieOptions.httpOnly,
    secure: defaultCookieOptions.secure,
    maxAge: defaultCookieOptions.maxAge,
    path: defaultCookieOptions.path,
    sameSite: defaultCookieOptions.sameSite as any,
  };
  if (COOKIE_DOMAIN) cookieOpts.domain = COOKIE_DOMAIN;
  response.cookies.set(cookieOpts as any);
}

/**
 * Helper to clear auth cookie
 */
export function clearAuthCookie(response: NextResponse) {
  const cookieOpts: Record<string, any> = {
    name: 'token',
    value: '',
    httpOnly: defaultCookieOptions.httpOnly,
    secure: defaultCookieOptions.secure,
    expires: new Date(0),
    path: defaultCookieOptions.path,
    sameSite: defaultCookieOptions.sameSite as any,
  };
  if (COOKIE_DOMAIN) cookieOpts.domain = COOKIE_DOMAIN;
  response.cookies.set(cookieOpts as any);
}

export async function logout() {
  // Intentionally do not modify cookies here. API routes should set/clear cookies on the
  // outgoing response (NextResponse) so the browser receives Set-Cookie headers.
  return true;
}

// Server-side session check - only use in API routes
export async function getServerSession() {
  try {
    // Read cookie using Next.js server cookies helper
    const token = cookies().get('token')?.value;
    if (!token) return null;

    // Verify JWT using jose for runtime compatibility
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });

    // Return minimal session-like object with explicit types
    return {
      userId: (payload as any).userId as string,
      role: (payload as any).role as string,
    };
  } catch (error) {
    console.error('getServerSession verify failed:', error);
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const verified = await decrypt(token);
    if (!verified || !shouldRefreshToken(verified as Record<string, unknown>)) {
      return null;
    }

    const newToken = await refreshAuthToken(verified as Record<string, unknown>);
    const response = NextResponse.next();
    setAuthCookie(response, newToken);

    return response;
  } catch (error) {
    console.error('Failed to update session:', error);
    return null;
  }
}

/**
 * Attach a refreshed auth cookie to an outgoing middleware response when needed.
 */
export async function attachRefreshedSessionCookie(
  response: NextResponse,
  session: Record<string, unknown> | null,
) {
  if (!session || !shouldRefreshToken(session)) return response;
  const newToken = await refreshAuthToken(session);
  setAuthCookie(response, newToken);
  return response;
}