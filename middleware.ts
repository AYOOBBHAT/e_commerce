import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Update auth session if token exists
  const response = await updateSession(request);
  if (response) return response;
  
  // Check for protected routes
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - no token needed
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/' ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/category') ||
    pathname === '/login' ||
    pathname === '/register'
    || pathname === '/forgot-password'
    || pathname === '/reset-password'
  ) {
    return NextResponse.next();
  }

  // Protected routes - token required
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes - admin role required
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = await decrypt(token);
    if (!session || session.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};