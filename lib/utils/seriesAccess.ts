import type { MatchPrivacy } from '@/lib/models/match';

/** Organizador ou admin da pelada (gestão, roster, carteira, convites). */
export function canManageSeries(options: {
  userId?: string;
  isOrganizer: boolean;
  organizerUids: string[];
}): boolean {
  if (options.isOrganizer) return true;
  if (options.userId && options.organizerUids.includes(options.userId)) return true;
  return false;
}

/** Partida privada: público, convite válido na URL/sessão, ou membro/organizador. */
export function canAccessPrivateMatch(options: {
  privacy: MatchPrivacy | undefined;
  inviteCode: string | undefined;
  isOrganizer: boolean;
  isParticipant: boolean;
}): boolean {
  const { privacy, inviteCode, isOrganizer, isParticipant } = options;
  if (isOrganizer || isParticipant) return true;
  if (privacy === 'public') return true;
  if (inviteCode) return true;
  return false;
}

/** Convidado sem conta pode pedir vaga com o link do convite. */
export function canGuestJoinWithInvite(options: {
  isGuestViewer: boolean;
  hasLocalGuest: boolean;
  isParticipant: boolean;
  accessBlocked: boolean;
  matchCancelled: boolean;
  inviteCode: string;
  privacy: MatchPrivacy | undefined;
}): boolean {
  if (!options.isGuestViewer) return false;
  if (options.hasLocalGuest || options.isParticipant) return false;
  if (options.accessBlocked || options.matchCancelled) return false;
  if (options.privacy === 'public') return true;
  return !!options.inviteCode;
}

/** Uma entrada por série na home (usa seriesId como id do card). */
export function groupWeeklyMatchesForHome(matches: import('@/lib/models/match').Match[]) {
  const bySeries = new Map<string, import('@/lib/models/match').Match>();

  for (const m of matches) {
    if (m.type !== 'weekly' && !m.seriesId) continue;
    const seriesKey = m.seriesId ?? m.id;
    const existing = bySeries.get(seriesKey);
    const candidate: import('@/lib/models/match').Match = {
      ...m,
      id: seriesKey,
      seriesId: seriesKey,
      type: 'weekly',
    };
    if (!existing || candidate.nextMatch.localeCompare(existing.nextMatch) < 0) {
      bySeries.set(seriesKey, candidate);
    }
  }

  return Array.from(bySeries.values());
}
