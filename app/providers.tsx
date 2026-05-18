'use client';

import { AuthProvider, useAuth } from '@/lib/auth/context';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/layout/AppShell';
import { shouldUseGuestShell } from '@/lib/guestRoutes';
import { usePathname } from 'next/navigation';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (pathname === '/login') return <>{children}</>;
  const guestMode = shouldUseGuestShell(pathname, { user, loading });
  return <AppShell guestMode={guestMode}>{children}</AppShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <Shell>{children}</Shell>
      </AuthGate>
    </AuthProvider>
  );
}
