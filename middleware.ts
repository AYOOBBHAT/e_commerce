import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from './lib/auth';
import { isMaintenanceMode } from './lib/maintenance-mode';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Payment routes must be completely auth-free, cookie-free, session-free, middleware-free
  // CRITICAL: Skip ALL middleware processing (including updateSession) for payment routes
  // This ensures webhooks and callbacks work without any authentication interference
  if (pathname.startsWith('/api/payments/')) {
    return NextResponse.next();
  }

  // Update auth session if token exists (skip for payment routes above)
  const response = await updateSession(request);
  if (response) return response;
  
  // Check for protected routes
  const token = request.cookies.get('token')?.value;
  const session = token ? await decrypt(token) : null;
  const isAdmin = session?.role === 'admin';

  // Always allow Next.js internal routes, static files, and API auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/debug')
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode from Redis (fast, no DB calls)
  // IMPORTANT: Admin users should always have access, even in maintenance mode
  const maintenanceMode = await isMaintenanceMode();
  
  // Debug logging
  if (maintenanceMode) {
    console.log(`[Middleware] 🔧 Maintenance mode ENABLED - pathname: ${pathname}, isAdmin: ${isAdmin}`);
  }
  
  // CRITICAL: If maintenance mode is ON and user is NOT admin, block everything except specific routes
  if (maintenanceMode && !isAdmin) {
    // Only allow these routes during maintenance mode (for non-admins):
    const allowedMaintenanceRoutes = [
      '/maintenance',
      '/login',
      '/register',
      '/api/auth',
      '/api/test-maintenance',
      '/api/debug'
    ];
    
    // Check if current path is allowed
    const isAllowedRoute = allowedMaintenanceRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    );
    
    if (isAllowedRoute) {
      console.log(`[Middleware] ✅ Allowing route ${pathname} during maintenance (allowed route)`);
      return NextResponse.next();
    }
    
    // Block all other routes - redirect pages to maintenance, block API calls
    if (!pathname.startsWith('/api/')) {
      console.log(`[Middleware] 🚫 Redirecting non-admin to /maintenance from ${pathname}`);
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
    
    // Block API routes (except the allowed ones above)
    console.log(`[Middleware] 🚫 Blocking API route ${pathname} - maintenance mode`);
    return NextResponse.json(
      { error: 'Service is under maintenance' },
      { status: 503 }
    );
  }
  
  // If we reach here, either maintenance mode is OFF, or user IS admin
  // Public routes - no token needed (only accessible when maintenance mode is OFF or user is admin)
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
    pathname.startsWith('/api/orders') || // Orders API (for checkout - needs to be public)
    pathname.startsWith('/api/settings') // Settings API (for payment methods)
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

  // Allow public GET requests to /api/admin/products and /api/admin/products/[id]
  if (pathname.startsWith('/api/admin/products')) {
    if (request.method === 'GET') {
      return NextResponse.next();
    }
    // For non-GET methods, require admin
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // All other /admin and /api/admin routes require admin
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