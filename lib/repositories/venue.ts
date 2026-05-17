import { api } from '@/lib/api/client';
import type { PaginatedVenuesDto, VenueDto } from '@/lib/api/types/social';
import type { SportType, Venue } from '@/lib/models/match';

function venueDtoToVenue(d: VenueDto): Venue {
  return {
    id: d.id,
    name: d.name,
    address: d.address,
    neighborhood: d.neighborhood ?? undefined,
    city: d.city ?? undefined,
    photo: d.photos?.[0],
    sports: (d.sports ?? []) as SportType[],
    matchCount: d.matchCount,
  };
}

export async function getPublicVenues(limit = 60): Promise<Venue[]> {
  const res = await api<PaginatedVenuesDto>(`/venues?limit=${limit}`);
  return res.items.map(venueDtoToVenue);
}
