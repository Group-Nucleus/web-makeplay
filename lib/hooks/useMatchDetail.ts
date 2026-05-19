'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth/context';
import {
  matchDocumentFromApiDetail,
  matchFromInviteIndexDto,
  matchListItemFromApiItem,
  participantFromApiDto,
} from '@/lib/mappers/match';
import type { Match } from '@/lib/models/match';
import type { MatchDocument, ParticipantDocument, ParticipantStatus } from '@/lib/models/match-document';
import { POLL_MATCH_DETAIL_MS } from '@/lib/constants';
import { buildInviteUrl } from '@/lib/config';
import { matchPathWithCode } from '@/lib/guestRoutes';
import {
  resolveMatchInviteCode,
  setGuestInviteContext,
} from '@/lib/storage/guestInvite';
import type { OccurrenceAttendanceDto } from '@/lib/api/types/match';
import {
  addMatchOrganizer,
  getInviteByCode,
  getMatchDetail,
  getMatchTeaser,
  joinMatch,
  joinMatchAsGuest,
  leaveMatch,
  normalizeInviteIndexId,
  removeMatchOrganizer,
  removeParticipant,
  toggleParticipantPaid,
  updateMatch,
  updateParticipantStatus,
} from '@/lib/repositories/match';
import { joinSeries, leaveSeries, setOccurrenceAttendance } from '@/lib/repositories/match-series';
import {
  canAccessPrivateMatch,
  canGuestJoinWithInvite,
  canManageSeries,
} from '@/lib/utils/seriesAccess';
import {
  ensureSeriesMembershipInRoster,
  isSeriesMembershipRequiredError,
} from '@/lib/utils/seriesMembership';
import {
  getGuestParticipant,
  setGuestParticipant,
  setPendingGuestClaimToken,
  type GuestParticipantRecord,
} from '@/lib/storage/guestParticipant';
import { matchKeys } from '@/lib/api/query-keys';

const DEFAULT_VIEWER_FLAGS = {
  isOrganizer: false,
  isParticipant: false,
  myParticipantId: null as string | null,
  myStatus: null as ParticipantStatus | null,
  canSeeSensitive: false,
};

interface MatchQueryResult {
  accessBlocked: boolean;
  loadError: string;
  match: Match | null;
  doc: MatchDocument | null;
  participants: ParticipantDocument[];
  organizerName: string;
  seriesId: string | null;
  viewerFlags: typeof DEFAULT_VIEWER_FLAGS;
  canSeeParticipantNames: boolean;
  attendance: OccurrenceAttendanceDto | null;
}

export function useMatchDetail(matchId: string, inviteCode?: string) {
  const { user, loading: authLoading, apiSessionReady } = useAuth();
  const queryClient = useQueryClient();

  const [inviteCodeResolved, setInviteCodeResolved] = useState(() =>
    resolveMatchInviteCode(matchId, inviteCode),
  );
  const codeNorm = inviteCodeResolved;
  const isGuestViewer = !authLoading && !user;

  const [localGuest, setLocalGuest] = useState<GuestParticipantRecord | null>(null);
  const [guestJoinOpen, setGuestJoinOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');

  useEffect(() => {
    setLocalGuest(getGuestParticipant(matchId));
  }, [matchId]);

  useEffect(() => {
    setInviteCodeResolved(resolveMatchInviteCode(matchId, inviteCode));
  }, [matchId, inviteCode]);

  const qKey = matchKeys.detail(matchId, codeNorm, localGuest?.guestToken);

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: qKey,
    queryFn: async (): Promise<MatchQueryResult> => {
      const guestToken = localGuest?.guestToken;
      try {
        let detail;
        try {
          detail = await getMatchDetail(matchId, codeNorm || undefined, guestToken);
        } catch {
          const teaser = await getMatchTeaser(matchId, codeNorm || undefined);
          detail = {
            match: teaser,
            participants: [] as [],
            viewer: { ...DEFAULT_VIEWER_FLAGS },
            organizer: undefined,
            seriesId: null as string | null,
            attendance: undefined,
          };
        }

        const resolvedSeriesId = detail.seriesId ?? detail.match.seriesId ?? null;
        const allowed = canAccessPrivateMatch({
          privacy: detail.match.privacy,
          inviteCode: codeNorm || undefined,
          isOrganizer: detail.viewer.isOrganizer,
          isParticipant: detail.viewer.isParticipant || detail.attendance != null,
        });

        if (!allowed) {
          return {
            accessBlocked: true,
            loadError: '',
            match: null,
            doc: null,
            participants: [],
            organizerName: '',
            seriesId: resolvedSeriesId,
            viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
            canSeeParticipantNames: false,
            attendance: null,
          };
        }

        const canSeeSensitive = detail.viewer.canSeeSensitive;
        if (codeNorm) {
          setGuestInviteContext({ target: 'match', matchId, code: codeNorm });
        }

        return {
          accessBlocked: false,
          loadError: '',
          match: matchListItemFromApiItem({ ...detail.match, id: matchId }),
          doc: matchDocumentFromApiDetail(detail),
          participants: canSeeSensitive
            ? (detail.participants ?? []).map(participantFromApiDto)
            : [],
          organizerName: detail.organizer?.displayName ?? '',
          seriesId: resolvedSeriesId,
          viewerFlags: {
            isOrganizer: detail.viewer.isOrganizer,
            isParticipant: detail.viewer.isParticipant,
            myParticipantId: detail.viewer.myParticipantId,
            myStatus: detail.viewer.myStatus,
            canSeeSensitive,
          },
          canSeeParticipantNames: canSeeSensitive,
          attendance: detail.attendance ?? null,
        };
      } catch {
        if (codeNorm) {
          const row = await getInviteByCode(codeNorm);
          if (row && row.matchId === matchId && row.target !== 'series') {
            return {
              accessBlocked: false,
              loadError: '',
              match: matchFromInviteIndexDto(row),
              doc: null,
              participants: [],
              organizerName: '',
              seriesId: null,
              viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
              canSeeParticipantNames: false,
              attendance: null,
            };
          }
        }
        return {
          accessBlocked: false,
          loadError: 'Partida não encontrada',
          match: null,
          doc: null,
          participants: [],
          organizerName: '',
          seriesId: null,
          viewerFlags: { ...DEFAULT_VIEWER_FLAGS },
          canSeeParticipantNames: false,
          attendance: null,
        };
      }
    },
    refetchInterval: () => {
      const needsPoll = apiSessionReady || !!codeNorm || isGuestViewer || !!localGuest;
      return needsPoll ? POLL_MATCH_DETAIL_MS : false;
    },
    refetchIntervalInBackground: false,
    staleTime: 4_000,
  });

  useEffect(() => {
    if (!inviteCodeResolved && queryData?.doc?.inviteCode) {
      setInviteCodeResolved(normalizeInviteIndexId(queryData.doc.inviteCode));
    }
  }, [inviteCodeResolved, queryData?.doc?.inviteCode]);

  // --- Derived state ---
  const match = queryData?.match ?? null;
  const doc = queryData?.doc ?? null;
  const participants = queryData?.participants ?? [];
  const organizerName = queryData?.organizerName ?? '';
  const seriesId = queryData?.seriesId ?? null;
  const viewerFlags = queryData?.viewerFlags ?? DEFAULT_VIEWER_FLAGS;
  const canSeeParticipantNames = queryData?.canSeeParticipantNames ?? false;
  const accessBlocked = queryData?.accessBlocked ?? false;
  const loadError = queryData?.loadError ?? '';
  const attendance = queryData?.attendance ?? null;

  const privacy = doc?.privacy ?? match?.privacy;
  const myStatus: ParticipantStatus | null = viewerFlags.myStatus ?? localGuest?.status ?? null;
  const isOrganizer = viewerFlags.isOrganizer;
  const viewerParticipantId = viewerFlags.myParticipantId ?? localGuest?.participantId ?? null;
  const organizerUid = doc?.createdBy ?? doc?.organizers?.[0];
  const organizerUids = doc?.organizers ?? [];
  const canManage = canManageSeries({
    userId: user?.uid,
    isOrganizer,
    organizerUids,
    canSeeSensitive: viewerFlags.canSeeSensitive,
  });
  const isSeriesMember = !!seriesId && viewerFlags.isParticipant;
  const canMarkOccurrenceAttendance =
    !!seriesId &&
    !!user &&
    !isGuestViewer &&
    (isOrganizer || viewerFlags.isParticipant || attendance !== null);
  const isJoined = viewerFlags.isParticipant || localGuest !== null || isOrganizer;
  const isPendingApproval = !isOrganizer && myStatus === 'aguardando-aprovacao';
  const viewerJoined = isJoined && !isPendingApproval;

  const sortOrganizerFirst = <T extends { uid: string | null }>(list: T[]) => {
    const creatorUid = doc?.createdBy;
    const adminSet = new Set(organizerUids);
    return [...list].sort((a, b) => {
      const score = (uid: string | null): number => {
        if (creatorUid && uid === creatorUid) return 0;
        if (uid && adminSet.has(uid)) return 1;
        return 2;
      };
      return score(a.uid) - score(b.uid);
    });
  };

  const canGuestJoin = canGuestJoinWithInvite({
    isGuestViewer,
    hasLocalGuest: localGuest !== null,
    isParticipant: viewerFlags.isParticipant,
    accessBlocked,
    matchCancelled: doc?.matchStatus === 'cancelled',
    inviteCode: codeNorm,
    privacy,
  });

  const spots = doc?.spots ?? match?.spots ?? 0;
  const dentroList = sortOrganizerFirst(participants.filter((p) => p.status === 'dentro'));
  const esperaList = participants.filter((p) => p.status === 'lista-espera');
  const foraList = participants.filter((p) => p.status === 'fora');
  const convidadoList = participants.filter((p) => p.status === 'convidado');
  const aguardandoList = participants.filter((p) => p.status === 'aguardando-aprovacao');
  const statsConfirmed = match?.participantStatsPreview?.dentroCount ?? 0;
  const occurrenceConfirmed =
    seriesId && attendance?.summary != null ? attendance.summary.vou : null;
  const confirmed =
    occurrenceConfirmed !== null
      ? occurrenceConfirmed
      : canSeeParticipantNames
        ? dentroList.length
        : statsConfirmed;
  const remaining = Math.max(0, spots - confirmed);
  const progressPercent = spots > 0 ? (confirmed / spots) * 100 : 0;
  const defaultAttendanceSummary = { vou: 0, naoVou: 0, pendente: 0 };
  const canShare = canManage && !!user && !isGuestViewer;

  // --- Mutation helpers ---
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, ...qKey],
  );

  // --- Mutations ---
  const guestJoinMutation = useMutation({
    mutationFn: (name: string) =>
      joinMatchAsGuest(matchId, name, codeNorm || doc?.inviteCode || undefined),
    onSuccess: (participant) => {
      const record: GuestParticipantRecord = {
        participantId: participant.id,
        name: participant.name,
        status: participant.status,
        guestToken: participant.guestToken ?? undefined,
      };
      setGuestParticipant(matchId, record);
      if (participant.guestToken) setPendingGuestClaimToken(participant.guestToken);
      setLocalGuest(record);
    },
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      seriesId
        ? joinSeries(seriesId, 'aguardando-aprovacao')
        : joinMatch(matchId, 'aguardando-aprovacao'),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao participar'),
  });

  const leaveMutation = useMutation({
    mutationFn: () =>
      seriesId && viewerFlags.isParticipant ? leaveSeries(seriesId) : leaveMatch(matchId),
    onSuccess: () => invalidate(),
  });

  const setAttendanceMutation = useMutation({
    mutationFn: async (status: 'vou' | 'nao-vou') => {
      if (!seriesId) return;
      await ensureSeriesMembershipInRoster(seriesId, {
        isParticipant: viewerFlags.isParticipant,
        autoJoinAsMember: isOrganizer || canManage,
      });
      try {
        await setOccurrenceAttendance(matchId, status);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (isSeriesMembershipRequiredError(msg) && (isOrganizer || canManage)) {
          await joinSeries(seriesId, 'dentro');
          await setOccurrenceAttendance(matchId, status);
          return;
        }
        throw e;
      }
    },
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao atualizar presença'),
  });

  const cancelOccurrenceMutation = useMutation({
    mutationFn: (cancelNote: string) =>
      updateMatch(matchId, { status: 'cancelled', cancelNote: cancelNote || null }),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao cancelar semana'),
  });

  const approveParticipantMutation = useMutation({
    mutationFn: (participantId: string) => {
      const status = remaining > 0 ? 'dentro' : 'lista-espera';
      return updateParticipantStatus(matchId, participantId, status);
    },
    onSuccess: () => invalidate(),
  });

  const rejectParticipantMutation = useMutation({
    mutationFn: (participantId: string) => removeParticipant(matchId, participantId),
    onSuccess: () => invalidate(),
  });

  const togglePaidMutation = useMutation({
    mutationFn: (participantId: string) => {
      const p = participants.find((x) => x.id === participantId);
      if (!p) throw new Error('Participante não encontrado');
      if (!canManage && p.uid !== user?.uid) throw new Error('Sem permissão');
      return toggleParticipantPaid(matchId, participantId, !p.isPaid);
    },
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao atualizar pagamento'),
  });

  const moveParticipantMutation = useMutation({
    mutationFn: ({
      participantId,
      status,
    }: {
      participantId: string;
      status: ParticipantStatus;
    }) => updateParticipantStatus(matchId, participantId, status),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao mover jogador'),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (participantId: string) => removeParticipant(matchId, participantId),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao remover jogador'),
  });

  const addOrganizerMutation = useMutation({
    mutationFn: (userId: string) => addMatchOrganizer(matchId, userId),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao adicionar admin'),
  });

  const removeOrganizerMutation = useMutation({
    mutationFn: (userId: string) => removeMatchOrganizer(matchId, userId),
    onSuccess: () => invalidate(),
    onError: (e) => setActionError(e instanceof Error ? e.message : 'Erro ao remover admin'),
  });

  const managing =
    approveParticipantMutation.isPending ||
    rejectParticipantMutation.isPending ||
    togglePaidMutation.isPending ||
    moveParticipantMutation.isPending ||
    removeParticipantMutation.isPending ||
    addOrganizerMutation.isPending ||
    removeOrganizerMutation.isPending ||
    cancelOccurrenceMutation.isPending;

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
    const message = `Confirma presença na ${match.title}?\n\n${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: match.title, text: message, url });
        return;
      } catch { /* fallback */ }
    }
    await copyText(message, 'Link de convite copiado!');
  };

  const handleSharePlayersList = async () => {
    if (!match) return;
    const list = dentroList.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const message = `Lista de confirmados — ${match.title}:\n\n${list}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `Jogadores — ${match.title}`, text: message });
        return;
      } catch { /* fallback */ }
    }
    await copyText(message, 'Lista copiada!');
  };

  const handleCopyInviteCode = async () => {
    const code = doc?.inviteCode;
    if (!code) return;
    await copyText(code, 'Código copiado!');
  };

  return {
    match,
    doc,
    participants,
    organizerName,
    loading,
    joining: joinMutation.isPending || guestJoinMutation.isPending,
    loadError,
    actionError,
    shareFeedback,
    isGuestViewer,
    accessBlocked,
    canSeeParticipantNames,
    canShare,
    guestInvitePath: codeNorm ? matchPathWithCode(matchId, codeNorm) : null,
    canGuestJoin,
    guestJoinOpen,
    setGuestJoinOpen,
    openGuestJoin: () => { if (canGuestJoin) setGuestJoinOpen(true); },
    isJoined,
    isPendingApproval,
    viewerJoined,
    isOrganizer,
    canManage,
    viewerParticipantId,
    organizerUid,
    seriesId,
    attendance,
    myAttendanceStatus: attendance?.myStatus ?? null,
    attendanceSummary: attendance?.summary ?? defaultAttendanceSummary,
    canMarkOccurrenceAttendance,
    isSeriesMember,
    attendanceBusy: setAttendanceMutation.isPending,
    handleSetAttendance: (s: 'vou' | 'nao-vou') => setAttendanceMutation.mutate(s),
    handleCancelOccurrence: (note: string) => cancelOccurrenceMutation.mutateAsync(note),
    spots,
    confirmed,
    remaining,
    progressPercent,
    dentroList,
    esperaList,
    foraList,
    convidadoList,
    aguardandoList,
    handleGuestJoin: async (name: string) => { await guestJoinMutation.mutateAsync(name); },
    handleRequestToJoin: async () => {
      if (joinMutation.isPending || isOrganizer) return;
      if (isGuestViewer) {
        if (canGuestJoin) setGuestJoinOpen(true);
        return;
      }
      if (!apiSessionReady) return;
      joinMutation.mutate();
    },
    handleLeave: () => leaveMutation.mutateAsync(),
    handleShareInvite,
    handleSharePlayersList,
    handleCopyInviteCode,
    handleApproveParticipant: (id: string) => approveParticipantMutation.mutateAsync(id),
    handleRejectParticipant: (id: string) => rejectParticipantMutation.mutateAsync(id),
    handleTogglePaid: (id: string) => togglePaidMutation.mutateAsync(id),
    handleMoveParticipant: (participantId: string, status: ParticipantStatus) =>
      moveParticipantMutation.mutateAsync({ participantId, status }),
    handleRemoveParticipant: (id: string) => removeParticipantMutation.mutateAsync(id),
    handleAddOrganizer: (userId: string) => addOrganizerMutation.mutateAsync(userId),
    handleRemoveOrganizer: (userId: string) => removeOrganizerMutation.mutateAsync(userId),
    organizerUids,
    managing,
    reload: () => queryClient.invalidateQueries({ queryKey: qKey }),
  };
}
