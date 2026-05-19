'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, User } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { getGuestInviteContext } from '@/lib/storage/guestInvite';
import { matchPathWithCode, seriesPathWithCode } from '@/lib/guestRoutes';

const AUTH_LINKS = [
  { href: '/', label: 'Início', Icon: Home },
  { href: '/explore', label: 'Explorar', Icon: Compass },
  { href: '/profile', label: 'Perfil', Icon: User },
] as const;

function Logo({ showWordmark = true }: { showWordmark?: boolean }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime text-sm font-black text-black">
        B
      </span>
      {showWordmark && (
        <span className="text-sm font-extrabold tracking-widest text-lime">BORAPLAY</span>
      )}
    </>
  );
}

export function Navbar({ guestMode = false }: { guestMode?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const showGuestNav = guestMode && !user;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (showGuestNav) {
    const invite = getGuestInviteContext();
    const homeHref = invite
      ? invite.target === 'series'
        ? seriesPathWithCode(invite.seriesId, invite.code)
        : matchPathWithCode(invite.matchId, invite.code)
      : pathname;

    return (
      <header className="sticky top-0 z-50 border-b border-elevated bg-black/95 backdrop-blur-sm supports-[backdrop-filter]:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2">
            <Logo />
          </Link>
          <span className="hidden truncate text-center text-xs font-medium text-muted sm:block">
            Convite à partida
          </span>
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-lime px-3 py-1.5 text-xs font-bold text-lime">
            Entrar
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Desktop */}
      <header className="sticky top-0 z-50 hidden border-b border-elevated bg-black md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5 lg:gap-8">
          <Link href="/" className="mr-auto flex shrink-0 items-center gap-2.5">
            <Logo />
          </Link>

          <nav className="flex items-center gap-1">
            {AUTH_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-card text-white'
                    : 'text-muted hover:text-white'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/profile"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card ${
              isActive('/profile') ? 'ring-1 ring-[#BFFF00]' : ''
            }`}
            aria-label="Perfil">
            <User className="h-[18px] w-[18px] text-white" />
          </Link>
        </div>
      </header>

      {/* Mobile — topo compacto */}
      <header className="sticky top-0 z-50 border-b border-elevated bg-black/95 backdrop-blur-sm supports-[backdrop-filter]:bg-black/80 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
        </div>
      </header>

      {/* Mobile — navegação inferior */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-elevated bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm supports-[backdrop-filter]:bg-black/90 md:hidden"
        aria-label="Navegação principal">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {AUTH_LINKS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-lime' : 'text-muted'
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
