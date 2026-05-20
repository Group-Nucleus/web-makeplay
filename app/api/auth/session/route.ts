import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND = process.env.API_UPSTREAM_URL ?? 'https://api-makeplay.onrender.com';
const COOKIE = 'bp_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
  };
}

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND}/v1/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const { accessToken, ...data } = await res.json();
  (await cookies()).set(COOKIE, accessToken as string, cookieOpts());
  return NextResponse.json(data);
}

export async function DELETE() {
  (await cookies()).delete(COOKIE);
  return NextResponse.json({ ok: true });
}
