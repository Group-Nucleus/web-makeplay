import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/api/token';
import type {
  SeriesDetailResponseDto,
  SeriesParticipantDto,
  UpdateSeriesPayload,
} from '@/lib/api/types/match-series';
import type { ParticipantStatus } from '@/lib/models/match-document';
import type { OccurrenceAttendanceStatus } from '@/lib/api/types/match';

import { normalizeInviteIndexId } from '@/lib/repositories/match';

export { normalizeInviteIndexId };

function queryString(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getSeriesDetail(
  seriesId: string,
  inviteCode?: string,
): Promise<SeriesDetailResponseDto> {
  const code = inviteCode ? normalizeInviteIndexId(inviteCode) : undefined;
  const skipAuth = !getAccessToken() && !!code;
  return api<SeriesDetailResponseDto>(
    `/match-series/${seriesId}${queryString({ code })}`,
    skipAuth ? { skipAuth: true } : {},
  );
}

export async function joinSeries(
  seriesId: string,
  status: ParticipantStatus,
): Promise<SeriesParticipantDto> {
  return api<SeriesParticipantDto>(`/match-series/${seriesId}/participants/join`, {
    method: 'POST',
    body: { status },
  });
}

export async function leaveSeries(seriesId: string): Promise<void> {
  await api<void>(`/match-series/${seriesId}/participants/me`, { method: 'DELETE' });
}

export async function updateSeries(
  seriesId: string,
  body: UpdateSeriesPayload,
): Promise<SeriesDetailResponseDto> {
  return api<SeriesDetailResponseDto>(`/match-series/${seriesId}`, {
    method: 'PATCH',
    body,
  });
}

export async function setOccurrenceAttendance(
  matchId: string,
  status: Exclude<OccurrenceAttendanceStatus, 'pendente'>,
): Promise<void> {
  await api<void>(`/matches/${matchId}/attendance`, {
    method: 'PUT',
    body: { status },
  });
}
