import { matchPathWithCode, seriesPathWithCode } from '@/lib/guestRoutes';
import { normalizeInviteIndexId } from '@/lib/repositories/match';

const KEY = 'boraplay_guest_invite';

export type GuestInviteContext =
  | { target: 'match'; matchId: string; code: string }
  | { target: 'series'; seriesId: string; code: string };

export function setGuestInviteContext(ctx: GuestInviteContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(ctx));
}

export function getGuestInviteContext(): GuestInviteContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuestInviteContext & {
      matchId?: string;
      seriesId?: string;
    };
    if (parsed.target === 'series' && parsed.seriesId && parsed.code) {
      return { target: 'series', seriesId: parsed.seriesId, code: parsed.code };
    }
    if (parsed.matchId && parsed.code) {
      return { target: 'match', matchId: parsed.matchId, code: parsed.code };
    }
  } catch {
    //
  }
  return null;
}

export function clearGuestInviteContext(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

/** Código do convite: query `?code=`, sessão após /invite/:code ou convite da pelada na série. */
export function resolveMatchInviteCode(matchId: string, inviteCode?: string): string {
  const fromUrl = inviteCode ? normalizeInviteIndexId(inviteCode) : '';
  if (fromUrl) return fromUrl;
  const ctx = getGuestInviteContext();
  if (!ctx?.code) return '';
  const code = normalizeInviteIndexId(ctx.code);
  if (ctx.target === 'match' && ctx.matchId === matchId) return code;
  if (ctx.target === 'series') return code;
  return '';
}

/** Destino após login: convite guardado no storage. */
export function getPostLoginRedirectPath(): string {
  const invite = getGuestInviteContext();
  if (!invite) return '/';
  if (invite.target === 'series') {
    return seriesPathWithCode(invite.seriesId, invite.code);
  }
  return matchPathWithCode(invite.matchId, invite.code);
}
