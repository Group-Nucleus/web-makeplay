'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth/context';
import { buildInviteUrl } from '@/lib/config';
import { POLL_MATCH_DETAIL_MS } from '@/lib/constants';
import { seriesPathWithCode } from '@/lib/guestRoutes';
import {
  matchFromSeriesInvite,
  seriesDocumentFromApiDetail,
  seriesParticipantFromApiDto,
} from '@/lib/mappers/match-series';
import { SPORT_IMAGES, formatMatchSchedule } from '@/lib/mappers/match';
import type { Match } from '@/lib/models/match';
import type { MatchDocument, ParticipantStatus } from '@/lib/models/match-document';
import type { SeriesOccurrenceDto } from '@/lib/api/types/match-series';
import { getInviteByCode, normalizeInviteIndexId } from '@/lib/repositories/match';
import { getSeriesDetail, joinSeries, leaveSeries } from '@/lib/repositories/match-series';
import { setGuestInviteContext } from '@/lib/storage/guestInvite';
import { canAccessPrivateMatch, canManageSeries } from '@/lib/utils/seriesAccess';
import { seriesKeys } from '@/lib/api/query-keys';

type SeriesParticipant = ReturnType<typeof seriesParticipantFromApiDto>;

interface SeriesQueryResult {
  accessBlocked: boolean;
  loadError: string;
  match: Match | null;
  doc: MatchDocument | null;
  occurrences: SeriesOccurrenceDto[];
  participants: SeriesParticipant[];
  organizerName: string;
  viewerFlags: {
    isOrganizer: boolean;
    isParticipant: boolean;
    myParticipantId: string | null;
    myStatus: ParticipantStatus | null;
    canSeeSensitive: boolean;
  };
  canSeeParticipantNames: boolean;
}

const DEFAULT_VIEWER_FLAGS = {
  isOrganizer: false,
  isParticipant: false,
  myParticipantId: null as string | null,
  myStatus: null as ParticipantStatus | null,
  canSeeSensitive: false,
};

export function useSeriesDetail(seriesId: string, inviteCode?: string) {
  const { user, loading: authLoading, apiSessionReady } = useAuth();
  const queryClient = useQueryClient();
  const codeNorm = inviteCode ? normalizeInviteIndexId(inviteCode) : '';
  const isGuestViewer = !authLoading && !user;

  const [shareFeedback, setShareFeedback] = useState('');
  const [error, setError] = useState('');

  const qKey = seriesKeys.detail(seriesId, codeNorm, user?.uid ?? '');

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: qKey,
    enabled: !authLoading,
    queryFn: async (): Promise<SeriesQueryResult> => {
      try {
        const detail = await getSeriesDetail(seriesId, codeNorm || undefined);
        const s = detail.series;

        const allowed = canAccessPrivateMatch({
          privacy: s.privacy,
          inviteCode: codeNorm || undefined,
          isOrganizer: detail.viewer.isOrganizer,
          isParticipant: detail.viewer.isParticipant,
        });

        if (!allowed) {
          return {
            accessBlocked: true,
            loadError: '',
            match: null,
            doc: null,
            occurrences: [],
            participants: [],
            organizerName: '',
            viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
            canSeeParticipantNames: false,
          };
        }

        const canSeeSensitive = detail.viewer.canSeeSensitive;
        if (codeNorm) {
          setGuestInviteContext({ target: 'series', seriesId, code: codeNorm });
        }

        return {
          accessBlocked: false,
          loadError: '',
          match: {
            id: seriesId,
            type: 'weekly',
            title: s.name,
            image: SPORT_IMAGES[s.sport],
            nextMatch: formatMatchSchedule(s.day, s.startTime, s.duration),
            location: s.location,
            isConfirmed: detail.viewer.isOrganizer || detail.viewer.myStatus === 'dentro',
            spots: s.spots,
            privacy: s.privacy,
            participantStatsPreview: s.participantStatsPreview,
          },
          doc: seriesDocumentFromApiDetail(detail),
          occurrences: detail.occurrences ?? [],
          participants: canSeeSensitive
            ? (detail.participants ?? []).map(seriesParticipantFromApiDto)
            : [],
          organizerName: detail.organizer?.displayName ?? '',
          viewerFlags: {
            isOrganizer: detail.viewer.isOrganizer,
            isParticipant: detail.viewer.isParticipant,
            myParticipantId: detail.viewer.myParticipantId,
            myStatus: detail.viewer.myStatus,
            canSeeSensitive,
          },
          canSeeParticipantNames: canSeeSensitive,
        };
      } catch {
        if (codeNorm) {
          const row = await getInviteByCode(codeNorm);
          if (row?.seriesId === seriesId) {
            return {
              accessBlocked: false,
              loadError: '',
              match: matchFromSeriesInvite(row),
              doc: null,
              occurrences: [],
              participants: [],
              organizerName: '',
              viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
              canSeeParticipantNames: false,
            };
          }
        }
        return {
          accessBlocked: false,
          loadError: 'Pelada não encontrada',
          match: null,
          doc: null,
          occurrences: [],
          participants: [],
          organizerName: '',
          viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
          canSeeParticipantNames: false,
        };
      }
    },
    refetchInterval: () => {
      const needsPoll = apiSessionReady || !!codeNorm || isGuestViewer;
      return needsPoll ? POLL_MATCH_DETAIL_MS : false;
    },
    refetchIntervalInBackground: false,
    staleTime: 4_000,
  });

  // propagate loadError from query result to local error state for consumers
  useEffect(() => {
    if (queryData?.loadError) setError(queryData.loadError);
    else setError('');
  }, [queryData?.loadError]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, ...qKey],
  );

  // --- Derived state ---
  const match = queryData?.match ?? null;
  const doc = queryData?.doc ?? null;
  const occurrences = queryData?.occurrences ?? [];
  const participants = queryData?.participants ?? [];
  const organizerName = queryData?.organizerName ?? '';
  const viewerFlags = queryData?.viewerFlags ?? DEFAULT_VIEWER_FLAGS;
  const canSeeParticipantNames = queryData?.canSeeParticipantNames ?? false;
  const accessBlocked = queryData?.accessBlocked ?? false;

  const privacy = doc?.privacy ?? match?.privacy;
  const isOrganizer = viewerFlags.isOrganizer;
  const isJoined = viewerFlags.isParticipant || isOrganizer;
  const isPendingApproval = !isOrganizer && viewerFlags.myStatus === 'aguardando-aprovacao';
  const canGuestJoin =
    isGuestViewer &&
    !isJoined &&
    (privacy === 'public' || (!!codeNorm && privacy === 'invite-only'));

  const organizerUid = doc?.createdBy ?? doc?.organizers?.[0];
  const organizerUids = doc?.organizers ?? [];
  const canManage = canManageSeries({
    userId: user?.uid,
    isOrganizer,
    organizerUids,
  });
  const canShare = canManage && !!user && !isGuestViewer;

  const dentroList = participants.filter(
    (p) => p.status === 'dentro' || p.status === 'convidado',
  );
  const esperaList = participants.filter((p) => p.status === 'lista-espera');
  const foraList = participants.filter((p) => p.status === 'fora');
  const convidadoList: typeof dentroList = [];
  const aguardandoList = participants.filter((p) => p.status === 'aguardando-aprovacao');
  const statsConfirmed = match?.participantStatsPreview?.dentroCount ?? 0;
  const confirmed = canSeeParticipantNames ? dentroList.length : statsConfirmed;
  const spots = doc?.spots ?? match?.spots ?? 0;
  const remaining = Math.max(0, spots - confirmed);
  const progressPercent = spots > 0 ? (confirmed / spots) * 100 : 0;

  // --- Mutations ---
  const joinMutation = useMutation({
    mutationFn: () => joinSeries(seriesId, 'aguardando-aprovacao'),
    onSuccess: () => invalidate(),
    onError: (e) => setError(e instanceof Error ? e.message : 'Erro ao entrar na pelada'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveSeries(seriesId),
    onSuccess: () => invalidate(),
  });

  // --- Share utils ---
  const copyText = async (text: string, feedback: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback(feedback);
      setTimeout(() => setShareFeedback(''), 2500);
    } catch {
      setShareFeedback('Não foi possível copiar');
    }
  };

  const handleShareInvite = async () => {
    const code = doc?.inviteCode;
    if (!code || !match) return;
    const url = buildInviteUrl(code);
    const message = `Entra na pelada ${match.title}?\n\n${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: match.title, text: message, url });
        return;
      } catch { /* fallback */ }
    }
    await copyText(message, 'Link da pelada copiado!');
  };

  const handleCopyInviteCode = async () => {
    const code = doc?.inviteCode;
    if (!code) return;
    await copyText(code, 'Código copiado!');
  };

  return {
    match,
    doc,
    occurrences,
    accessBlocked,
    myStatus: viewerFlags.myStatus,
    participants,
    organizerName,
    loading,
    joining: joinMutation.isPending,
    error,
    shareFeedback,
    isGuestViewer,
    canSeeParticipantNames,
    canShare,
    canGuestJoin,
    guestInvitePath: codeNorm ? seriesPathWithCode(seriesId, codeNorm) : null,
    isJoined,
    isPendingApproval,
    isOrganizer,
    isParticipant: viewerFlags.isParticipant,
    canManage,
    organizerUid,
    organizerUids,
    viewerParticipantId: viewerFlags.myParticipantId,
    spots,
    confirmed,
    remaining,
    progressPercent,
    dentroList,
    esperaList,
    foraList,
    convidadoList,
    aguardandoList,
    handleRequestToJoin: async () => {
      if (joinMutation.isPending || isOrganizer || isGuestViewer || !apiSessionReady) return;
      joinMutation.mutate();
    },
    handleLeave: () => leaveMutation.mutateAsync(),
    handleShareInvite,
    handleCopyInviteCode,
    reload: () => queryClient.invalidateQueries({ queryKey: qKey }),
  };
}
