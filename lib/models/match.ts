export type MatchType = 'weekly' | 'oneoff';
export type MatchPrivacy = 'public' | 'friends-of-friends' | 'friends' | 'invite-only';
export type SportType =
  | 'soccer'
  | 'volleyball'
  | 'basketball'
  | 'tennis'
  | 'beach-tennis'
  | 'kart'
  | 'swimming'
  | 'padel';
export type DetailTab = 'INFO' | 'JOGADORES' | 'ESTATÍSTICAS';

export interface ParticipantStatsPreview {
  dentroCount: number;
  listaEsperaCount: number;
  aguardandoCount: number;
}

export interface Match {
  id: string;
  type: MatchType;
  title: string;
  image?: string;
  nextMatch: string;
  location?: string;
  distance?: string;
  isConfirmed: boolean;
  spots: number;
  privacy: MatchPrivacy;
  participantStatsPreview?: ParticipantStatsPreview;
  hydrateFromInviteRoute?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  city?: string;
  photo?: string;
  sports: SportType[];
  matchCount?: number;
}

export interface CreateMatchForm {
  type: MatchType;
  sport: SportType | '';
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
}
