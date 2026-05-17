'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/context';
import { LoginPage } from '@/components/auth/LoginPage';

const GUEST_PREFIXES = ['/match/', '/invite/'];

function isGuestRoute(pathname: string) {
  return GUEST_PREFIXES.some((p) => pathname.startsWith(p));
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, apiSessionReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const guest = isGuestRoute(pathname);

  useEffect(() => {
    if (!loading && !user && !guest && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, guest, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  if (guest) return <>{children}</>;

  if (!user || !apiSessionReady) {
    if (pathname === '/login') return <LoginPage />;
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
