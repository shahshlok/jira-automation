import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Don't check auth for login page, API routes, or static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Check if user has auth cookie
  const authCookie = request.cookies.get('jira_auth');
  const cloudIdCookie = request.cookies.get('cloudId');
  
  // For debugging - log auth attempts (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Middleware] ${pathname} - Auth: ${authCookie ? 'YES' : 'NO'}, CloudId: ${cloudIdCookie ? 'YES' : 'NO'}`);
  }
  
  // If no auth cookie or cloudId, redirect to login
  if (!authCookie?.value || !cloudIdCookie?.value) {
    if (pathname !== '/login') {
      console.log(`[Auth Middleware] Redirecting to login - missing auth cookie or cloudId`);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  
  // If authenticated and accessing root, redirect to dashboard
  if (pathname === '/') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};