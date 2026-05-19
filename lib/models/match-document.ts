import type { MatchStatus } from '@/lib/api/types/match';
import type { MatchPrivacy, MatchType, SportType } from '@/lib/models/match';

export type ParticipantStatus =
  | 'dentro'
  | 'lista-espera'
  | 'fora'
  | 'convidado'
  | 'aguardando-aprovacao';

export interface ParticipantDocument {
  id: string;
  uid: string | null;
  guestToken?: string | null;
  name: string;
  position?: string;
  status: ParticipantStatus;
  isPaid: boolean;
  addedBy: string;
  addedAt: string;
}

export interface MatchDocument {
  seriesId?: string | null;
  scheduledAt?: string | null;
  monthKey?: string | null;
  matchStatus?: MatchStatus;
  cancelNote?: string | null;
  type: MatchType;
  sport: SportType;
  name: string;
  location: string;
  venueId?: string;
  day: string;
  startTime: string;
  duration: string;
  gameType: string;
  spots: number;
  pricePerGame: number;
  priceMonthly: number;
  intensity: string;
  ageMin: number;
  ageMax: number;
  privacy: MatchPrivacy;
  hideFromAbsent: boolean;
  hidePhoneNumber: boolean;
  organizers: string[];
  createdBy: string;
  createdAt: string;
  inviteCode: string;
  description?: string | null;
}
