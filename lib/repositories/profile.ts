import { api } from '@/lib/api/client';
import type { PaginatedProfilesDto, PublicProfileDto } from '@/lib/api/types/social';
import type { UserDocument } from '@/lib/models/user';

function profileToUser(p: PublicProfileDto): UserDocument {
  const rating = p.stats?.rating ?? 50;
  return {
    uid: p.id,
    displayName: p.displayName,
    email: '',
    photoURL: p.photoURL ?? undefined,
    username: p.username ?? undefined,
    position: p.position ?? undefined,
    number: 0,
    stats: { atk: rating, def: rating, str: rating, skl: rating, rating },
    createdAt: '',
  };
}

export async function listPublicProfiles(limit = 60): Promise<UserDocument[]> {
  const res = await api<PaginatedProfilesDto>(`/profiles?limit=${limit}`);
  return res.items.map(profileToUser);
}
