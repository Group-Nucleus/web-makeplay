import type { MatchPrivacy, MatchType, SportType } from '@/lib/models/match';
import type { ParticipantStatus, ParticipantType } from '@/lib/models/match-document';
import type { MatchStatus, OccurrenceAttendanceStatus } from '@/lib/api/types/match';

export interface SeriesListItemDto {
  id: string;
  status: string;
  name: string;
  sport: SportType;
  location: string;
  venueId?: string | null;
  day: string;
  startTime: string;
  duration: string;
  gameType: string;
  spots: number;
  ageMin: number;
  ageMax: number;
  privacy: MatchPrivacy;
  organizers: string[];
  createdBy: string;
  createdAt: string;
  participantStatsPreview?: {
    dentroCount: number;
    listaEsperaCount: number;
    aguardandoCount: number;
  };
}

export interface SeriesRestrictedDto {
  inviteCode: string;
  pricePerGame: number;
  priceMonthly: number;
  intensity: string;
  hideFromAbsent: boolean;
  hidePhoneNumber: boolean;
  description?: string | null;
}

export interface SeriesDetailSeriesDto extends SeriesListItemDto {
  restricted?: SeriesRestrictedDto;
}

export interface SeriesOccurrenceDto {
  id: string;
  day: string;
  scheduledAt: string;
  inviteCode: string;
  status: MatchStatus;
  monthKey?: string;
}

export interface SeriesParticipantDto {
  id: string;
  uid: string | null;
  name: string;
  position?: string;
  status: ParticipantStatus;
  participantType: ParticipantType;
  isPaid: boolean;
  monthKey?: string | null;
  addedBy: string;
  addedAt: string;
}

export interface SeriesViewerDto {
  isOrganizer: boolean;
  isParticipant: boolean;
  myParticipantId: string | null;
  myStatus: ParticipantStatus | null;
  canSeeSensitive: boolean;
}

export interface SeriesDetailResponseDto {
  series: SeriesDetailSeriesDto;
  viewer: SeriesViewerDto;
  participants?: SeriesParticipantDto[];
  organizer?: { uid: string; displayName: string; phone: string | null };
  occurrences: SeriesOccurrenceDto[];
}

export interface CreateWeeklyOccurrenceDto {
  id: string;
  day: string;
  scheduledAt: string;
  inviteCode: string;
  monthKey: string;
}

export interface CreateWeeklyMatchResponseDto {
  seriesId: string;
  seriesInviteCode: string;
  occurrences: CreateWeeklyOccurrenceDto[];
}

export interface UpdateSeriesPayload {
  name?: string;
  location?: string;
  venueId?: string | null;
  day?: string;
  startTime?: string;
  duration?: string;
  gameType?: string;
  spots?: number;
  pricePerGame?: number;
  priceMonthly?: number;
  intensity?: string;
  ageMin?: number;
  ageMax?: number;
  privacy?: MatchPrivacy;
  hideFromAbsent?: boolean;
  hidePhoneNumber?: boolean;
  description?: string | null;
  applyToFuture?: boolean;
}
