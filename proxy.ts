import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('bp_token')?.value;
  if (!token) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Authorization', `Bearer ${token}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: '/v1/:path*',
};
