'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/context';
import { LoginPage } from '@/components/auth/LoginPage';
import { isGuestPathname, matchPathWithCode, seriesPathWithCode } from '@/lib/guestRoutes';
import { getGuestInviteContext } from '@/lib/storage/guestInvite';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, apiSessionReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const guestRoute = isGuestPathname(pathname);

  useEffect(() => {
    if (loading || user) return;

    if (guestRoute || pathname === '/login') return;

    const invite = getGuestInviteContext();
    if (invite) {
      router.replace(
        invite.target === 'series'
          ? seriesPathWithCode(invite.seriesId, invite.code)
          : matchPathWithCode(invite.matchId, invite.code),
      );
      return;
    }

    if (pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, guestRoute, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  if (guestRoute) return <>{children}</>;

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
