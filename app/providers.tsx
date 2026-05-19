'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

import { AuthProvider, useAuth } from '@/lib/auth/context';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { shouldUseGuestShell } from '@/lib/guestRoutes';
import { createQueryClient } from '@/lib/api/query-client';
import { Analytics } from '@vercel/analytics/next';

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (pathname === '/login') return <>{children}</>;
  const guestMode = shouldUseGuestShell(pathname, { user, loading });
  return <AppShell guestMode={guestMode}>{children}</AppShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <ErrorBoundary>
            <Shell>{children}</Shell>
            <Analytics />
          </ErrorBoundary>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
