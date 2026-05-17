'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/layout/Navbar';

export function AppShell({
  children,
  guestMode = false,
}: {
  children: React.ReactNode;
  guestMode?: boolean;
}) {
  const pathname = usePathname();
  const wide = pathname.startsWith('/match/') || pathname.startsWith('/profile');

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar guestMode={guestMode} />
      <main className={`mx-auto w-full flex-1 px-0 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  );
}
