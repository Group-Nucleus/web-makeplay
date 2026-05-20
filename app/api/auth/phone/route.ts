import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND = process.env.API_UPSTREAM_URL ?? 'https://api-makeplay.onrender.com';
const COOKIE = 'bp_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND}/v1/auth/phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const { accessToken, ...data } = await res.json();
  (await cookies()).set(COOKIE, accessToken as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
  return NextResponse.json(data);
}
