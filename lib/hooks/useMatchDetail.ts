'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/context';
import {
  matchDocumentFromApiDetail,
  matchFromInviteIndexDto,
  matchListItemFromApiItem,
  participantFromApiDto,
} from '@/lib/mappers/match';
import type { Match } from '@/lib/models/match';
import type { MatchDocument, ParticipantStatus } from '@/lib/models/match-document';
import { POLL_MATCH_DETAIL_MS } from '@/lib/constants';
import { buildInviteUrl } from '@/lib/config';
import { matchPathWithCode } from '@/lib/guestRoutes';
import { setGuestInviteContext } from '@/lib/storage/guestInvite';
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
  updateParticipantStatus,
} from '@/lib/repositories/match';
import {
  getGuestParticipant,
  setGuestParticipant,
  setPendingGuestClaimToken,
  type GuestParticipantRecord,
} from '@/lib/storage/guestParticipant';

export function useMatchDetail(matchId: string, inviteCode?: string) {
  const { user, loading: authLoading, apiSessionReady } = useAuth();
  const codeNorm = inviteCode ? normalizeInviteIndexId(inviteCode) : '';
  const isGuestViewer = !authLoading && !user;

  const [match, setMatch] = useState<Match | null>(null);
  const [doc, setDoc] = useState<MatchDocument | null>(null);
  const [participants, setParticipants] = useState<ReturnType<typeof participantFromApiDto>[]>([]);
  const [organizerName, setOrganizerName] = useState('');
  const [viewerFlags, setViewerFlags] = useState({
    isOrganizer: false,
    isParticipant: false,
    myParticipantId: null as string | null,
    myStatus: null as ParticipantStatus | null,
  });
  const [localGuest, setLocalGuest] = useState<GuestParticipantRecord | null>(null);
  const [guestJoinOpen, setGuestJoinOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [canSeeParticipantNames, setCanSeeParticipantNames] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    setLocalGuest(getGuestParticipant(matchId));
  }, [matchId]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError('');
    const guestToken = localGuest?.guestToken;
    try {
      let detail;
      try {
        detail = await getMatchDetail(matchId, codeNorm || undefined, guestToken);
      } catch {
        const teaser = await getMatchTeaser(matchId, codeNorm || undefined);
        detail = {
          match: teaser,
          participants: [],
          viewer: {
            isOrganizer: false,
            isParticipant: false,
            myParticipantId: null,
            myStatus: null,
            canSeeSensitive: false,
          },
        };
      }
      const m = matchListItemFromApiItem({ ...detail.match, id: matchId });
      setMatch(m);
      setDoc(matchDocumentFromApiDetail(detail));
      const plist = detail.participants ?? [];
      setCanSeeParticipantNames(plist.length > 0);
      setParticipants(plist.map(participantFromApiDto));
      setOrganizerName(detail.organizer?.displayName ?? '');
      if (codeNorm) {
        setGuestInviteContext({ matchId, code: codeNorm });
      }
      setViewerFlags({
        isOrganizer: detail.viewer.isOrganizer,
        isParticipant: detail.viewer.isParticipant,
        myParticipantId: detail.viewer.myParticipantId,
        myStatus: detail.viewer.myStatus,
      });
    } catch {
      if (codeNorm) {
        const row = await getInviteByCode(codeNorm);
        if (row && row.matchId === matchId) {
          setMatch(matchFromInviteIndexDto(row));
        } else {
          setError('Partida não encontrada');
        }
      } else {
        setError('Partida não encontrada');
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [matchId, codeNorm, localGuest?.guestToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const needsPoll =
      apiSessionReady || !!codeNorm || isGuestViewer || !!localGuest;
    if (!needsPoll) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void load({ silent: true });
    };

    const t = setInterval(tick, POLL_MATCH_DETAIL_MS);
    return () => clearInterval(t);
  }, [load, apiSessionReady, codeNorm, isGuestViewer, localGuest]);

  const privacy = doc?.privacy ?? match?.privacy;
  const myStatus: ParticipantStatus | null =
    viewerFlags.myStatus ?? localGuest?.status ?? null;
  const isOrganizer = viewerFlags.isOrganizer;
  const viewerParticipantId =
    viewerFlags.myParticipantId ?? localGuest?.participantId ?? null;
  const organizerUid = doc?.organizers?.[0] ?? doc?.createdBy;
  const isJoined =
    viewerFlags.isParticipant || localGuest !== null || isOrganizer;
  const isPendingApproval = !isOrganizer && myStatus === 'aguardando-aprovacao';
  const viewerJoined = isJoined && !isPendingApproval;

  const sortOrganizerFirst = <T extends { uid: string | null }>(list: T[]) => {
    if (!organizerUid) return list;
    return [...list].sort((a, b) => {
      const aOrg = a.uid === organizerUid ? 0 : 1;
      const bOrg = b.uid === organizerUid ? 0 : 1;
      return aOrg - bOrg;
    });
  };
  const canGuestJoin =
    isGuestViewer &&
    !isJoined &&
    (privacy === 'public' || (!!codeNorm && privacy === 'invite-only'));

  const handleGuestJoin = async (name: string) => {
    setJoining(true);
    setError('');
    try {
      const participant = await joinMatchAsGuest(matchId, name, codeNorm || undefined);
      const record: GuestParticipantRecord = {
        participantId: participant.id,
        name: participant.name,
        status: participant.status,
        guestToken: participant.guestToken ?? undefined,
      };
      setGuestParticipant(matchId, record);
      if (participant.guestToken) {
        setPendingGuestClaimToken(participant.guestToken);
      }
      setLocalGuest(record);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao participar');
      throw e;
    } finally {
      setJoining(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (joining || isOrganizer) return;
    if (isGuestViewer) {
      if (canGuestJoin) setGuestJoinOpen(true);
      return;
    }
    if (!apiSessionReady) return;
    setJoining(true);
    setError('');
    try {
      await joinMatch(matchId, 'aguardando-aprovacao');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao participar');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    await leaveMatch(matchId);
    await load();
  };

  const spots = doc?.spots ?? match?.spots ?? 0;
  const dentroList = sortOrganizerFirst(
    participants.filter((p) => p.status === 'dentro'),
  );
  const esperaList = participants.filter((p) => p.status === 'lista-espera');
  const foraList = participants.filter((p) => p.status === 'fora');
  const convidadoList = participants.filter((p) => p.status === 'convidado');
  const aguardandoList = participants.filter((p) => p.status === 'aguardando-aprovacao');
  const statsConfirmed = match?.participantStatsPreview?.dentroCount ?? 0;
  const confirmed = canSeeParticipantNames ? dentroList.length : statsConfirmed;
  const remaining = Math.max(0, spots - confirmed);
  const progressPercent = spots > 0 ? (confirmed / spots) * 100 : 0;
  const canShare = !!user && !isGuestViewer;

  const handleApproveParticipant = async (participantId: string) => {
    const status = remaining > 0 ? 'dentro' : 'lista-espera';
    await updateParticipantStatus(matchId, participantId, status);
    await load();
  };

  const handleRejectParticipant = async (participantId: string) => {
    await removeParticipant(matchId, participantId);
    await load();
  };

  const handleTogglePaid = async (participantId: string) => {
    if (!isOrganizer) {
      const p = participants.find((x) => x.id === participantId);
      if (p?.uid !== user?.uid) return;
    }
    const p = participants.find((x) => x.id === participantId);
    if (!p) return;
    setManaging(true);
    try {
      await toggleParticipantPaid(matchId, participantId, !p.isPaid);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar pagamento');
    } finally {
      setManaging(false);
    }
  };

  const handleMoveParticipant = async (participantId: string, status: ParticipantStatus) => {
    if (!isOrganizer) return;
    setManaging(true);
    setError('');
    try {
      await updateParticipantStatus(matchId, participantId, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao mover jogador');
      throw e;
    } finally {
      setManaging(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!isOrganizer) return;
    setManaging(true);
    setError('');
    try {
      await removeParticipant(matchId, participantId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover jogador');
      throw e;
    } finally {
      setManaging(false);
    }
  };

  const handleAddOrganizer = async (userId: string) => {
    if (!isOrganizer) return;
    setManaging(true);
    setError('');
    try {
      await addMatchOrganizer(matchId, userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar admin');
      throw e;
    } finally {
      setManaging(false);
    }
  };

  const handleRemoveOrganizer = async (userId: string) => {
    if (!isOrganizer) return;
    setManaging(true);
    setError('');
    try {
      await removeMatchOrganizer(matchId, userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover admin');
    } finally {
      setManaging(false);
    }
  };

  const organizerUids = doc?.organizers ?? [];
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
        await navigator.share({
          title: match.title,
          text: message,
          url,
        });
        return;
      } catch {
        /* fallback copy */
      }
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
      } catch {
        /* fallback */
      }
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
    joining,
    error,
    shareFeedback,
    isGuestViewer,
    canSeeParticipantNames,
    canShare,
    guestInvitePath: codeNorm ? matchPathWithCode(matchId, codeNorm) : null,
    canGuestJoin,
    guestJoinOpen,
    setGuestJoinOpen,
    isJoined,
    isPendingApproval,
    viewerJoined,
    isOrganizer,
    viewerParticipantId,
    organizerUid,
    spots,
    confirmed,
    remaining,
    progressPercent,
    dentroList,
    esperaList,
    foraList,
    convidadoList,
    aguardandoList,
    handleGuestJoin,
    handleRequestToJoin,
    handleLeave,
    handleShareInvite,
    handleSharePlayersList,
    handleCopyInviteCode,
    handleApproveParticipant,
    handleRejectParticipant,
    handleTogglePaid,
    handleMoveParticipant,
    handleRemoveParticipant,
    handleAddOrganizer,
    handleRemoveOrganizer,
    organizerUids,
    managing,
    reload: load,
  };
}
