import { getServerSession, decrypt } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';   // 🚀 disable prerender
export const revalidate = 0;              // 🚀 no ISR, always run fresh

export async function GET(request: Request) {
  try {
    // Try normal session
    const session = await getServerSession();
    if (session?.userId) {
      return withNoCache(
        NextResponse.json({ user: { id: session.userId, role: session.role || 'user' } })
      );
    }

    // Fallback: manual cookie parse + decrypt
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader
        .split(';')
        .map(s => s.trim())
        .find(s => s.startsWith('token='));

      if (tokenMatch) {
        const token = tokenMatch.split('=')[1];
        const verified = await decrypt(token);
        if (verified && (verified as any).userId) {
          return withNoCache(
            NextResponse.json({ user: { id: (verified as any).userId, role: (verified as any).role || 'user' } })
          );
        }
      }
    } catch (e) {
      console.error('Session fallback parse error:', e);
    }

    // If nothing found
    return withNoCache(NextResponse.json({ user: null }));
  } catch (error) {
    console.error('Session error:', error);
    return withNoCache(NextResponse.json({ user: null }));
  }
}

/**
 * Helper to attach no-cache headers to any response
 */
function withNoCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  res.headers.set('Surrogate-Control', 'no-store');
  return res;
}
