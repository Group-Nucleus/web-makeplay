import { matchPathWithCode } from '@/lib/guestRoutes';

const KEY = 'boraplay_guest_invite';

export interface GuestInviteContext {
  matchId: string;
  code: string;
}

export function setGuestInviteContext(ctx: GuestInviteContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(ctx));
}

export function getGuestInviteContext(): GuestInviteContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuestInviteContext;
    if (parsed.matchId && parsed.code) return parsed;
  } catch {
    //
  }
  return null;
}

export function clearGuestInviteContext(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

/** Destino após login: partida do convite, se existir no storage. */
export function getPostLoginRedirectPath(): string {
  const invite = getGuestInviteContext();
  if (invite) return matchPathWithCode(invite.matchId, invite.code);
  return '/';
}
