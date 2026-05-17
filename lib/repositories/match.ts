import { api } from '@/lib/api/client';
import type {
  CreateMatchResponseDto,
  InviteIndexDto,
  MatchDetailResponseDto,
  PaginatedMatchesDto,
  ParticipantDto,
} from '@/lib/api/types/match';
import type { CreateMatchForm } from '@/lib/models/match';
import type { ParticipantStatus } from '@/lib/models/match-document';

export async function createMatch(form: CreateMatchForm): Promise<string> {
  const res = await api<CreateMatchResponseDto>('/matches', {
    method: 'POST',
    body: { ...form, sport: form.sport || 'soccer', venueId: form.venueId },
  });
  return res.id;
}

export function normalizeInviteIndexId(code: string | null | undefined): string {
  if (typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

function queryString(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listMatches(params: {
  role?: 'organizer' | 'participant';
  privacy?: 'public';
  limit?: number;
}): Promise<PaginatedMatchesDto> {
  return api<PaginatedMatchesDto>(
    `/matches${queryString({ role: params.role, privacy: params.privacy, limit: params.limit ?? 60 })}`,
  );
}

export async function getMatchDetail(
  matchId: string,
  inviteCode?: string,
): Promise<MatchDetailResponseDto> {
  const code = inviteCode ? normalizeInviteIndexId(inviteCode) : undefined;
  return api<MatchDetailResponseDto>(`/matches/${matchId}${queryString({ code })}`);
}

export async function getMatchTeaser(
  matchId: string,
  inviteCode?: string,
): Promise<MatchDetailResponseDto['match']> {
  const code = inviteCode ? normalizeInviteIndexId(inviteCode) : undefined;
  return api<MatchDetailResponseDto['match']>(
    `/matches/${matchId}/teaser${queryString({ code })}`,
  );
}

export async function getInviteByCode(code: string): Promise<InviteIndexDto | null> {
  const norm = normalizeInviteIndexId(code);
  if (!norm) return null;
  try {
    return await api<InviteIndexDto>(`/invites/${encodeURIComponent(norm)}`, {
      skipAuth: true,
    });
  } catch {
    return null;
  }
}

export async function joinMatch(matchId: string, status: ParticipantStatus): Promise<ParticipantDto> {
  return api<ParticipantDto>(`/matches/${matchId}/participants/join`, {
    method: 'POST',
    body: { status },
  });
}

export async function joinMatchAsGuest(
  matchId: string,
  name: string,
  inviteProof?: string,
): Promise<ParticipantDto> {
  return api<ParticipantDto>(`/matches/${matchId}/participants/guest`, {
    method: 'POST',
    body: { name, inviteProof },
    skipAuth: true,
  });
}

export async function updateParticipantStatus(
  matchId: string,
  participantId: string,
  status: ParticipantStatus,
): Promise<ParticipantDto> {
  return api<ParticipantDto>(`/matches/${matchId}/participants/${participantId}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function leaveMatch(matchId: string): Promise<void> {
  await api<void>(`/matches/${matchId}/participants/me`, { method: 'DELETE' });
}
