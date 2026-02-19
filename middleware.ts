import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/api/auth') || path.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token && path.startsWith('/dashboard')) {
    const login = new URL('/login', req.url);
    login.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
