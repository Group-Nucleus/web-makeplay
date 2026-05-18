import type { MatchListItemDto, InviteIndexDto, MatchDetailResponseDto, ParticipantDto } from '@/lib/api/types/match';
import type { Match, SportType } from '@/lib/models/match';
import type { MatchDocument, ParticipantDocument } from '@/lib/models/match-document';

const SPORT_IMAGES: Record<SportType, string> = {
  soccer: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg',
  volleyball: 'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg',
  basketball: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
  tennis: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg',
  'beach-tennis': 'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg',
  kart: 'https://images.pexels.com/photos/12797366/pexels-photo-12797366.jpeg',
  swimming: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg',
  padel: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg',
};

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseDurationMinutes(d: string): number {
  if (d.endsWith('min')) return parseInt(d, 10);
  const [h, m] = d.split('h');
  return parseInt(h, 10) * 60 + (m ? parseInt(m, 10) : 0);
}

export function formatMatchSchedule(day: string, startTime: string, duration: string): string {
  if (!day || !startTime || !duration) return '';
  const [dd, mm, yyyy] = day.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  const dayStr = String(dd).padStart(2, '0');
  const month = MONTHS_PT[mm - 1] ?? '';
  const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const weekday = weekdays[date.getDay()] ?? '';
  const [sh, sm] = startTime.split(':').map(Number);
  const endMins = sh * 60 + sm + parseDurationMinutes(duration);
  const endH = String(Math.floor(endMins / 60) % 24).padStart(2, '0');
  const endM = String(endMins % 60).padStart(2, '0');
  return `${dayStr} ${month} • ${weekday} • ${startTime} - ${endH}:${endM}`;
}

export function matchListItemFromApiItem(item: MatchListItemDto): Match {
  return {
    id: item.id,
    type: item.type,
    title: item.name,
    image: SPORT_IMAGES[item.sport],
    nextMatch: formatMatchSchedule(item.day, item.startTime, item.duration),
    location: item.location,
    distance: '2,9km',
    isConfirmed: false,
    spots: item.spots,
    privacy: item.privacy,
    participantStatsPreview: item.participantStatsPreview,
  };
}

export function matchFromInviteIndexDto(row: InviteIndexDto): Match {
  return {
    id: row.matchId,
    type: row.type,
    title: row.name,
    image: SPORT_IMAGES[row.sport],
    nextMatch: formatMatchSchedule(row.day, row.startTime, row.duration),
    location: row.location,
    isConfirmed: false,
    spots: row.spots,
    privacy: row.privacy,
    hydrateFromInviteRoute: true,
  };
}

export function matchDocumentFromApiDetail(detail: MatchDetailResponseDto): MatchDocument {
  const m = detail.match;
  const r = m.restricted;
  return {
    type: m.type,
    sport: m.sport,
    name: m.name,
    location: m.location,
    venueId: m.venueId ?? undefined,
    day: m.day,
    startTime: m.startTime,
    duration: m.duration,
    gameType: m.gameType,
    spots: m.spots,
    pricePerGame: r?.pricePerGame ?? 0,
    priceMonthly: r?.priceMonthly ?? 0,
    intensity: r?.intensity ?? '',
    ageMin: m.ageMin,
    ageMax: m.ageMax,
    privacy: m.privacy,
    hideFromAbsent: r?.hideFromAbsent ?? false,
    hidePhoneNumber: r?.hidePhoneNumber ?? false,
    organizers: m.organizers,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
    inviteCode: r?.inviteCode ?? '',
    description: r?.description ?? null,
  };
}

export function participantFromApiDto(p: ParticipantDto): ParticipantDocument {
  return {
    id: p.id,
    uid: p.uid,
    name: p.name,
    position: p.position,
    status: p.status,
    isPaid: p.isPaid,
    addedBy: p.addedBy,
    addedAt: p.addedAt,
  };
}
