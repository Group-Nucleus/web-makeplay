'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, User } from 'lucide-react';

import { getGuestInviteContext } from '@/lib/storage/guestInvite';
import { matchPathWithCode } from '@/lib/guestRoutes';

const AUTH_LINKS = [
  { href: '/', label: 'Início', Icon: Home },
  { href: '/explore', label: 'Explorar', Icon: Compass },
  { href: '/profile', label: 'Perfil', Icon: User },
] as const;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BFFF00] text-sm font-black text-black">
        B
      </span>
      {!compact && (
        <span className="hidden text-sm font-extrabold tracking-widest text-[#BFFF00] min-[380px]:inline">
          BORAPLAY
        </span>
      )}
    </>
  );
}

export function Navbar({ guestMode = false }: { guestMode?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (guestMode) {
    const invite = getGuestInviteContext();
    const homeHref = invite ? matchPathWithCode(invite.matchId, invite.code) : pathname;

    return (
      <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-black/95 backdrop-blur-sm supports-[backdrop-filter]:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2">
            <Logo />
          </Link>
          <span className="hidden truncate text-center text-xs font-medium text-[#888] sm:block">
            Convite à partida
          </span>
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-[#BFFF00] px-3 py-1.5 text-xs font-bold text-[#BFFF00]">
            Entrar
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Desktop */}
      <header className="sticky top-0 z-50 hidden border-b border-[#2a2a2a] bg-black md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5 lg:gap-8">
          <Link href="/" className="mr-auto flex shrink-0 items-center gap-2.5">
            <Logo />
            <span className="text-sm font-extrabold tracking-widest text-[#BFFF00]">BORAPLAY</span>
          </Link>

          <nav className="flex items-center gap-1">
            {AUTH_LINKS.map((item) => (
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

          <Link
            href="/profile"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] ${
              isActive('/profile') ? 'ring-1 ring-[#BFFF00]' : ''
            }`}
            aria-label="Perfil">
            <User className="h-[18px] w-[18px] text-white" />
          </Link>
        </div>
      </header>

      {/* Mobile — topo compacto */}
      <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-black/95 backdrop-blur-sm supports-[backdrop-filter]:bg-black/80 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-extrabold tracking-widest text-[#BFFF00]">BORAPLAY</span>
          </Link>
        </div>
      </header>

      {/* Mobile — navegação inferior */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#2a2a2a] bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm supports-[backdrop-filter]:bg-black/90 md:hidden"
        aria-label="Navegação principal">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {AUTH_LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#BFFF00]' : 'text-[#888]'
                }`}>
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
