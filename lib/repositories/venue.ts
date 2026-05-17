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

export type CreateVenueForm = {
  name: string;
  address: string;
  neighborhood?: string;
  city?: string;
  photos?: string[];
  sports: SportType[];
  amenities?: string[];
  phone?: string;
  openingHours?: string;
  isPublic: boolean;
};

export async function createVenue(form: CreateVenueForm): Promise<string> {
  const created = await api<VenueDto>('/venues', {
    method: 'POST',
    body: {
      ...form,
      photos: form.photos ?? [],
      amenities: form.amenities ?? [],
    },
  });
  return created.id;
}

export async function getPublicVenues(limit = 60): Promise<Venue[]> {
  const qs = new URLSearchParams({ isPublic: 'true', limit: String(limit) });
  const res = await api<PaginatedVenuesDto>(`/venues?${qs.toString()}`);
  return res.items.map(venueDtoToVenue);
}
