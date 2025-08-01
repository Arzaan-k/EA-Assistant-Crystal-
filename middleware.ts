import { auth } from "./auth"
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicPath = pathname === '/login' || pathname === '/' || pathname.startsWith('/api/health');
  const isAuthRoute = pathname.startsWith('/api/auth');

  if (pathname === '/login' && req.auth) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isPublicPath || isAuthRoute) {
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|images|public/).*)",
    "/api/(.*)",
  ],
}
