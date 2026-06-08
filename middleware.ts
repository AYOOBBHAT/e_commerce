import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { attachRefreshedSessionCookie, decrypt } from './lib/auth';
import { isMaintenanceMode } from './lib/maintenance-mode';

type SessionPayload = {
  userId?: string;
  role?: string;
  exp?: number;
};

async function continueWithOptionalRefresh(
  response: NextResponse,
  session: SessionPayload | null,
) {
  if (response.status >= 300 && response.status < 400) {
    return response;
  }
  return attachRefreshedSessionCookie(response, session as Record<string, unknown> | null);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Payment routes must be completely auth-free
  if (pathname.startsWith('/api/payments/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const session = token ? ((await decrypt(token)) as SessionPayload | null) : null;
  const isAdmin = session?.role === 'admin';

  // Always allow Next.js internal routes and auth API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/debug')
  ) {
    return continueWithOptionalRefresh(NextResponse.next(), session);
  }

  // Authenticated users should never land on auth pages (fixes browser Back to /login)
  if (
    session?.userId &&
    (pathname === '/login' || pathname === '/register')
  ) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const maintenanceMode = await isMaintenanceMode();

  if (maintenanceMode) {
    console.log(`[Middleware] 🔧 Maintenance mode ENABLED - pathname: ${pathname}, isAdmin: ${isAdmin}`);
  }

  if (maintenanceMode && !isAdmin) {
    const allowedMaintenanceRoutes = [
      '/maintenance',
      '/login',
      '/register',
      '/api/auth',
      '/api/test-maintenance',
      '/api/debug',
    ];

    const isAllowedRoute = allowedMaintenanceRoutes.some(
      (route) => pathname === route || pathname.startsWith(route),
    );

    if (isAllowedRoute) {
      console.log(`[Middleware] ✅ Allowing route ${pathname} during maintenance (allowed route)`);
      return continueWithOptionalRefresh(NextResponse.next(), session);
    }

    if (!pathname.startsWith('/api/')) {
      console.log(`[Middleware] 🚫 Redirecting non-admin to /maintenance from ${pathname}`);
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    console.log(`[Middleware] 🚫 Blocking API route ${pathname} - maintenance mode`);
    return NextResponse.json(
      { error: 'Service is under maintenance' },
      { status: 503 },
    );
  }

  // Public routes — no token required
  if (
    pathname === '/' ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/quick-links') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/maintenance' ||
    pathname === '/api/products' ||
    pathname.startsWith('/api/products/') ||
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/settings')
  ) {
    return continueWithOptionalRefresh(NextResponse.next(), session);
  }

  // Protected routes — token required
  if (!token || !session?.userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/api/admin/products')) {
    if (request.method === 'GET') {
      return continueWithOptionalRefresh(NextResponse.next(), session);
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return continueWithOptionalRefresh(NextResponse.next(), session);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
