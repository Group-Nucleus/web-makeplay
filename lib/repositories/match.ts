import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/api/token';
import type { CreateWeeklyMatchResponseDto } from '@/lib/api/types/match-series';
import type {
  CreateMatchApiResponse,
  InviteIndexDto,
  MatchDetailResponseDto,
  PaginatedMatchesDto,
  ParticipantDto,
  UpdateMatchPayload,
} from '@/lib/api/types/match';
import type { CreateMatchForm } from '@/lib/models/match';
import type { ParticipantStatus } from '@/lib/models/match-document';

export type CreateMatchResult =
  | { kind: 'oneoff'; matchId: string; inviteCode: string }
  | {
      kind: 'weekly';
      seriesId: string;
      seriesInviteCode: string;
      occurrences: CreateWeeklyMatchResponseDto['occurrences'];
    };

function isWeeklyCreateResponse(
  res: CreateMatchApiResponse,
): res is CreateWeeklyMatchResponseDto {
  return 'seriesId' in res && typeof res.seriesId === 'string';
}

export async function updateMatch(
  matchId: string,
  body: UpdateMatchPayload,
): Promise<MatchDetailResponseDto> {
  return api<MatchDetailResponseDto>(`/matches/${matchId}`, {
    method: 'PATCH',
    body,
  });
}

export async function createMatch(form: CreateMatchForm): Promise<CreateMatchResult> {
  const res = await api<CreateMatchApiResponse>('/matches', {
    method: 'POST',
    body: { ...form, sport: form.sport || 'soccer', venueId: form.venueId },
  });
  if (isWeeklyCreateResponse(res)) {
    return {
      kind: 'weekly',
      seriesId: res.seriesId,
      seriesInviteCode: res.seriesInviteCode,
      occurrences: res.occurrences,
    };
  }
  return { kind: 'oneoff', matchId: res.id, inviteCode: res.inviteCode };
}

export function normalizeInviteIndexId(code: string | null | undefined): string {
  if (typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

export function queryString(params: Record<string, string | number | undefined>): string {
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
  guestToken?: string,
): Promise<MatchDetailResponseDto> {
  const code = inviteCode ? normalizeInviteIndexId(inviteCode) : undefined;
  const skipAuth = !getAccessToken() && (!!code || !!guestToken);
  return api<MatchDetailResponseDto>(
    `/matches/${matchId}${queryString({ code, guestToken })}`,
    skipAuth ? { skipAuth: true } : {},
  );
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

export async function joinMatch(
  matchId: string,
  status: ParticipantStatus,
  inviteCode?: string,
): Promise<ParticipantDto> {
  return api<ParticipantDto>(`/matches/${matchId}/participants/join`, {
    method: 'POST',
    body: inviteCode ? { status, inviteCode } : { status },
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

export async function removeParticipant(matchId: string, participantId: string): Promise<void> {
  await api<void>(`/matches/${matchId}/participants/${participantId}`, { method: 'DELETE' });
}

export async function toggleParticipantPaid(
  matchId: string,
  participantId: string,
  isPaid: boolean,
): Promise<ParticipantDto> {
  return api<ParticipantDto>(`/matches/${matchId}/participants/${participantId}/paid`, {
    method: 'PATCH',
    body: { isPaid },
  });
}

export async function addMatchOrganizer(
  matchId: string,
  userId: string,
): Promise<{ organizers: string[] }> {
  return api<{ organizers: string[] }>(`/matches/${matchId}/organizers`, {
    method: 'POST',
    body: { userId },
  });
}

export async function removeMatchOrganizer(
  matchId: string,
  userId: string,
): Promise<{ organizers: string[] }> {
  return api<{ organizers: string[] }>(
    `/matches/${matchId}/organizers/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}
