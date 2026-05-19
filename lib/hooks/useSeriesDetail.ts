'use client';

import { useCallback, useEffect, useState } from 'react';

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
import {
  getSeriesDetail,
  joinSeries,
  leaveSeries,
} from '@/lib/repositories/match-series';
import { setGuestInviteContext } from '@/lib/storage/guestInvite';
import { canAccessPrivateMatch, canManageSeries } from '@/lib/utils/seriesAccess';

export function useSeriesDetail(seriesId: string, inviteCode?: string) {
  const { user, loading: authLoading, apiSessionReady } = useAuth();
  const codeNorm = inviteCode ? normalizeInviteIndexId(inviteCode) : '';
  const isGuestViewer = !authLoading && !user;

  const [match, setMatch] = useState<Match | null>(null);
  const [doc, setDoc] = useState<MatchDocument | null>(null);
  const [occurrences, setOccurrences] = useState<SeriesOccurrenceDto[]>([]);
  const [participants, setParticipants] = useState<ReturnType<typeof seriesParticipantFromApiDto>[]>(
    [],
  );
  const [organizerName, setOrganizerName] = useState('');
  const [viewerFlags, setViewerFlags] = useState({
    isOrganizer: false,
    isParticipant: false,
    myParticipantId: null as string | null,
    myStatus: null as ParticipantStatus | null,
    canSeeSensitive: false,
  });
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [canSeeParticipantNames, setCanSeeParticipantNames] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError('');
    setAccessBlocked(false);
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
        setAccessBlocked(true);
        setMatch(null);
        setDoc(null);
        setOccurrences([]);
        return;
      }
      setMatch({
        id: seriesId,
        type: 'weekly',
        title: s.name,
        image: SPORT_IMAGES[s.sport],
        nextMatch: formatMatchSchedule(s.day, s.startTime, s.duration),
        location: s.location,
        isConfirmed:
          detail.viewer.isOrganizer || detail.viewer.myStatus === 'dentro',
        spots: s.spots,
        privacy: s.privacy,
        participantStatsPreview: s.participantStatsPreview,
      });
      const canSeeSensitive = detail.viewer.canSeeSensitive;
      setDoc(seriesDocumentFromApiDetail(detail));
      const plist = canSeeSensitive ? (detail.participants ?? []) : [];
      setCanSeeParticipantNames(canSeeSensitive && plist.length > 0);
      setParticipants(plist.map(seriesParticipantFromApiDto));
      setOccurrences(detail.occurrences ?? []);
      setOrganizerName(detail.organizer?.displayName ?? '');
      if (codeNorm) {
        setGuestInviteContext({ target: 'series', seriesId, code: codeNorm });
      }
      setViewerFlags({
        isOrganizer: detail.viewer.isOrganizer,
        isParticipant: detail.viewer.isParticipant,
        myParticipantId: detail.viewer.myParticipantId,
        myStatus: detail.viewer.myStatus,
        canSeeSensitive,
      });
    } catch {
      if (codeNorm) {
        const row = await getInviteByCode(codeNorm);
        if (row?.seriesId === seriesId) {
          setMatch(matchFromSeriesInvite(row));
          setAccessBlocked(false);
        } else {
          setError('Pelada não encontrada');
        }
      } else {
        setAccessBlocked(true);
        setError('Pelada não encontrada');
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [seriesId, codeNorm]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const needsPoll = apiSessionReady || !!codeNorm || isGuestViewer;
    if (!needsPoll) return;
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void load({ silent: true });
    }, POLL_MATCH_DETAIL_MS);
    return () => clearInterval(t);
  }, [load, apiSessionReady, codeNorm, isGuestViewer]);

  const privacy = doc?.privacy ?? match?.privacy;
  const isOrganizer = viewerFlags.isOrganizer;
  const isJoined = viewerFlags.isParticipant || isOrganizer;
  const isPendingApproval =
    !isOrganizer && viewerFlags.myStatus === 'aguardando-aprovacao';
  const canGuestJoin =
    isGuestViewer &&
    !isJoined &&
    (privacy === 'public' || (!!codeNorm && privacy === 'invite-only'));

  const handleRequestToJoin = async () => {
    if (joining || isOrganizer || isGuestViewer) return;
    if (!apiSessionReady) return;
    setJoining(true);
    setError('');
    try {
      await joinSeries(seriesId, 'aguardando-aprovacao');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar na pelada');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    await leaveSeries(seriesId);
    await load();
  };

  const organizerUid = doc?.organizers?.[0] ?? doc?.createdBy;
  const dentroList = participants.filter((p) => p.status === 'dentro');
  const esperaList = participants.filter((p) => p.status === 'lista-espera');
  const foraList = participants.filter((p) => p.status === 'fora');
  const convidadoList = participants.filter((p) => p.status === 'convidado');
  const aguardandoList = participants.filter((p) => p.status === 'aguardando-aprovacao');
  const statsConfirmed = match?.participantStatsPreview?.dentroCount ?? 0;
  const confirmed = canSeeParticipantNames ? dentroList.length : statsConfirmed;
  const spots = doc?.spots ?? match?.spots ?? 0;
  const remaining = Math.max(0, spots - confirmed);
  const progressPercent = spots > 0 ? (confirmed / spots) * 100 : 0;
  const organizerUids = doc?.organizers ?? [];
  const canManage = canManageSeries({
    userId: user?.uid,
    isOrganizer,
    organizerUids,
    canSeeSensitive: viewerFlags.canSeeSensitive,
  });
  const canShare = canManage && !!user && !isGuestViewer;

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
      } catch {
        //
      }
    }
    await copyText(message, 'Link da pelada copiado!');
  };

  const handleCopyInviteCode = async () => {
    const code = doc?.inviteCode;
    if (!code) return;
    await copyText(code, 'Código copiado!');
  };

  const myStatus = viewerFlags.myStatus;

  return {
    match,
    doc,
    occurrences,
    accessBlocked,
    myStatus,
    participants,
    organizerName,
    loading,
    joining,
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
    handleRequestToJoin,
    handleLeave,
    handleShareInvite,
    handleCopyInviteCode,
    reload: load,
  };
}
