import type { InviteIndexDto } from '@/lib/api/types/match';
import type {
  SeriesDetailResponseDto,
  SeriesParticipantDto,
} from '@/lib/api/types/match-series';
import type { Match } from '@/lib/models/match';
import type { MatchDocument, ParticipantDocument } from '@/lib/models/match-document';
import { formatMatchSchedule, SPORT_IMAGES } from '@/lib/mappers/match';

export function seriesParticipantFromApiDto(p: SeriesParticipantDto): ParticipantDocument {
  return {
    id: p.id,
    uid: p.uid,
    name: p.name,
    position: p.position,
    status: p.status,
    participantType: p.participantType,
    isPaid: p.isPaid,
    addedBy: p.addedBy,
    addedAt: p.addedAt,
  };
}

export function seriesDocumentFromApiDetail(detail: SeriesDetailResponseDto): MatchDocument {
  const s = detail.series;
  const r = s.restricted;
  return {
    type: 'weekly',
    sport: s.sport,
    name: s.name,
    location: s.location,
    venueId: s.venueId ?? undefined,
    day: s.day,
    startTime: s.startTime,
    duration: s.duration,
    gameType: s.gameType,
    spots: s.spots,
    pricePerGame: r?.pricePerGame ?? 0,
    priceMonthly: r?.priceMonthly ?? 0,
    intensity: r?.intensity ?? '',
    ageMin: s.ageMin,
    ageMax: s.ageMax,
    privacy: s.privacy,
    hideFromAbsent: r?.hideFromAbsent ?? false,
    hidePhoneNumber: r?.hidePhoneNumber ?? false,
    organizers: s.organizers,
    createdBy: s.createdBy,
    createdAt: s.createdAt,
    inviteCode: r?.inviteCode ?? '',
    description: r?.description ?? null,
  };
}

export function matchFromSeriesInvite(row: InviteIndexDto): Match {
  return {
    id: row.seriesId ?? '',
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
