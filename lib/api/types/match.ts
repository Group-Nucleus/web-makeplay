import type { CreateWeeklyMatchResponseDto } from '@/lib/api/types/match-series';
import type { MatchPrivacy, MatchType, SportType } from '@/lib/models/match';
import type { ParticipantStatus, ParticipantType } from '@/lib/models/match-document';

export type InviteTarget = 'match' | 'series';
export type MatchStatus = 'scheduled' | 'open' | 'cancelled' | 'completed';
export type OccurrenceAttendanceStatus = 'vou' | 'nao-vou' | 'pendente';

export interface MatchListItemDto {
  id: string;
  type: MatchType;
  seriesId?: string | null;
  scheduledAt?: string | null;
  monthKey?: string | null;
  status?: MatchStatus;
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

export interface MatchRestrictedDto {
  inviteCode: string;
  pricePerGame: number;
  priceMonthly: number;
  intensity: string;
  hideFromAbsent: boolean;
  hidePhoneNumber: boolean;
  description?: string | null;
}

export interface MatchDetailMatchDto extends MatchListItemDto {
  restricted?: MatchRestrictedDto;
}

export interface ParticipantDto {
  id: string;
  uid: string | null;
  name: string;
  position?: string;
  status: ParticipantStatus;
  participantType: ParticipantType;
  isPaid: boolean;
  addedBy: string;
  addedAt: string;
  guestToken?: string | null;
}

export interface MatchViewerDto {
  isOrganizer: boolean;
  isParticipant: boolean;
  myParticipantId: string | null;
  myStatus: ParticipantStatus | null;
  canSeeSensitive: boolean;
}

export interface OrganizerDto {
  uid: string;
  displayName: string;
  phone: string | null;
}

export interface OccurrenceAttendanceSummaryDto {
  vou: number;
  naoVou: number;
  pendente: number;
}

export interface OccurrenceAttendanceMemberDto {
  uid: string;
  name: string;
  status: OccurrenceAttendanceStatus;
}

export interface OccurrenceAttendanceDto {
  myStatus: OccurrenceAttendanceStatus | null;
  summary: OccurrenceAttendanceSummaryDto;
  members?: OccurrenceAttendanceMemberDto[];
}

export interface MatchDetailResponseDto {
  match: MatchDetailMatchDto;
  participants?: ParticipantDto[];
  viewer: MatchViewerDto;
  organizer?: OrganizerDto;
  seriesId?: string | null;
  attendance?: OccurrenceAttendanceDto;
}

export interface InviteIndexDto {
  code: string;
  target: InviteTarget;
  matchId: string | null;
  seriesId: string | null;
  type: MatchType;
  name: string;
  sport: SportType;
  location: string;
  day: string;
  startTime: string;
  duration: string;
  spots: number;
  privacy: MatchPrivacy;
  participantStatsPreview?: {
    dentroCount: number;
    listaEsperaCount: number;
    aguardandoCount: number;
  };
}

export interface PaginatedMatchesDto {
  items: MatchListItemDto[];
  hasMore: boolean;
}

export interface CreateMatchResponseDto {
  id: string;
  inviteCode: string;
}

export type CreateMatchApiResponse = CreateMatchResponseDto | CreateWeeklyMatchResponseDto;

/** Body parcial para PATCH /matches/:id */
export interface UpdateMatchPayload {
  status?: MatchStatus;
  cancelNote?: string | null;
  type?: MatchType;
  sport?: SportType;
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
}
