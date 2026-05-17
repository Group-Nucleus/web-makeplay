'use client';

import { AuthProvider } from '@/lib/auth/context';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  const guest = pathname.startsWith('/match/') || pathname.startsWith('/invite/');
  return <AppShell guestMode={guest}>{children}</AppShell>;
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
