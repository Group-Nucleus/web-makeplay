import type { MatchPrivacy } from '@/lib/models/match';

/** Organizador ou admin da pelada (gestão, roster, carteira, convites). */
export function canManageSeries(options: {
  userId?: string;
  isOrganizer: boolean;
  organizerUids: string[];
  canSeeSensitive?: boolean;
}): boolean {
  if (options.canSeeSensitive) return true;
  if (options.isOrganizer) return true;
  if (options.userId && options.organizerUids.includes(options.userId)) return true;
  return false;
}

/** Peladas weekly / invite-only: só público, convite na URL ou membro/organizador. */
export function canAccessPrivateMatch(options: {
  privacy: MatchPrivacy | undefined;
  inviteCode: string | undefined;
  isOrganizer: boolean;
  isParticipant: boolean;
}): boolean {
  const { privacy, inviteCode, isOrganizer, isParticipant } = options;
  if (isOrganizer || isParticipant) return true;
  if (privacy === 'public') return true;
  if (privacy === 'invite-only' && inviteCode) return true;
  return false;
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
