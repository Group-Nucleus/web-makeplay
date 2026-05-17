'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

const AUTH_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/explore', label: 'Explorar' },
  { href: '/profile', label: 'Perfil' },
] as const;

export function Navbar({ guestMode = false }: { guestMode?: boolean }) {
  const pathname = usePathname();
  const links = guestMode
    ? ([{ href: '/explore', label: 'Explorar' }] as const)
    : AUTH_LINKS;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-black">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3.5">
        <Link href={guestMode ? '/explore' : '/'} className="mr-auto flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BFFF00] text-sm font-black text-black">
            B
          </span>
          <span className="text-sm font-extrabold tracking-widest text-[#BFFF00]">BORAPLAY</span>
        </Link>

        <nav className="flex items-center gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#888] hover:text-white'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {!guestMode && (
          <Link
            href="/profile"
            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A1A1A] ${
              isActive('/profile') ? 'ring-1 ring-[#BFFF00]' : ''
            }`}
            aria-label="Perfil">
            <User className="h-[18px] w-[18px] text-white" />
          </Link>
        )}
      </div>
    </header>
  );
}
