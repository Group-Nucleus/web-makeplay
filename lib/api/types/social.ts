export interface PublicProfileDto {
  id: string;
  displayName: string;
  username?: string | null;
  photoURL?: string | null;
  position?: string | null;
  stats?: { rating: number };
}

export interface PaginatedProfilesDto {
  items: PublicProfileDto[];
  hasMore: boolean;
}

export interface VenueDto {
  id: string;
  name: string;
  address: string;
  neighborhood?: string | null;
  city?: string | null;
  photos: string[];
  sports: string[];
  matchCount?: number;
  createdBy: string;
  createdAt: string;
}

export interface PaginatedVenuesDto {
  items: VenueDto[];
  hasMore: boolean;
}

export interface FriendshipDto {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}
