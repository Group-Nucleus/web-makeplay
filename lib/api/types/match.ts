import type { MatchPrivacy, MatchType, SportType } from '@/lib/models/match';
import type { ParticipantStatus } from '@/lib/models/match-document';

export interface MatchListItemDto {
  id: string;
  type: MatchType;
  name: string;
  sport: SportType;
  location: string;
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
  isPaid: boolean;
  addedBy: string;
  addedAt: string;
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

export interface MatchDetailResponseDto {
  match: MatchDetailMatchDto;
  participants?: ParticipantDto[];
  viewer: MatchViewerDto;
  organizer?: OrganizerDto;
}

export interface InviteIndexDto {
  code: string;
  matchId: string;
  type: MatchType;
  name: string;
  sport: SportType;
  location: string;
  day: string;
  startTime: string;
  duration: string;
  spots: number;
  privacy: MatchPrivacy;
}

export interface PaginatedMatchesDto {
  items: MatchListItemDto[];
  hasMore: boolean;
}

export interface CreateMatchResponseDto {
  id: string;
  inviteCode: string;
}
