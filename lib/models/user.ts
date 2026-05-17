export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  username?: string;
  position?: string;
  number?: number;
  stats?: {
    atk: number;
    def: number;
    str: number;
    skl: number;
    rating: number;
  };
  createdAt?: string;
}

export interface UserProfileStats {
  matchesPlayed: number;
  matchesOrganized: number;
  totalSpent: number;
  matchesPaid: number;
  avgSpent: number;
}
