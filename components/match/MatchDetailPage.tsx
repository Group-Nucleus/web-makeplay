'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/context';
import {
  matchDocumentFromApiDetail,
  matchFromInviteIndexDto,
  matchListItemFromApiItem,
  participantFromApiDto,
} from '@/lib/mappers/match';
import type { Match } from '@/lib/models/match';
import type { MatchDocument, ParticipantDocument } from '@/lib/models/match-document';
import {
  getInviteByCode,
  getMatchDetail,
  getMatchTeaser,
  joinMatch,
  joinMatchAsGuest,
  leaveMatch,
  normalizeInviteIndexId,
} from '@/lib/repositories/match';

const FIELD_IMAGE =
  'https://images.pexels.com/photos/36958045/pexels-photo-36958045.jpeg';

const SPORT_LABEL: Record<string, string> = {
  soccer: 'Futebol',
  volleyball: 'Vôlei',
  basketball: 'Basquete',
  tennis: 'Tênis',
};

type Tab = 'INFO' | 'JOGADORES';

export function MatchDetailPage({
  matchId,
  inviteCode,
}: {
  matchId: string;
  inviteCode?: string;
}) {
  const { user, apiSessionReady } = useAuth();
  const codeNorm = inviteCode ? normalizeInviteIndexId(inviteCode) : '';
  const [match, setMatch] = useState<Match | null>(null);
  const [doc, setDoc] = useState<MatchDocument | null>(null);
  const [participants, setParticipants] = useState<ParticipantDocument[]>([]);
  const [organizerName, setOrganizerName] = useState('');
  const [viewerJoined, setViewerJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>('INFO');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let detail;
      try {
        detail = await getMatchDetail(matchId, codeNorm || undefined);
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
      setParticipants((detail.participants ?? []).map(participantFromApiDto));
      setOrganizerName(detail.organizer?.displayName ?? '');
      setViewerJoined(detail.viewer.isParticipant);
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
      setLoading(false);
    }
  }, [matchId, codeNorm]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleJoin = async () => {
    if (!user && !guestName.trim()) return;
    setJoining(true);
    try {
      if (user && apiSessionReady) {
        await joinMatch(matchId, 'dentro');
      } else {
        await joinMatchAsGuest(matchId, guestName.trim(), codeNorm || undefined);
      }
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="mb-4 text-white">{error || 'Partida não encontrada'}</p>
        <Link href="/explore" className="text-[#BFFF00]">
          Voltar ao explorar
        </Link>
      </div>
    );
  }

  const subtitle = [doc ? SPORT_LABEL[doc.sport] : '', doc?.gameType].filter(Boolean).join(' • ');
  const dentro = participants.filter((p) => p.status === 'dentro');

  return (
    <div className="px-6 py-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[340px]">
          <div className="overflow-hidden rounded-2xl bg-[#1A1A1A]">
            <div
              className="relative h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${match.image ?? FIELD_IMAGE})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <h1 className="text-2xl font-bold text-white">{match.title}</h1>
                {subtitle && <p className="text-sm text-[#ccc]">{subtitle}</p>}
              </div>
            </div>
            <div className="space-y-3 p-4">
              {!viewerJoined ? (
                user ? (
                  <button
                    type="button"
                    disabled={joining}
                    onClick={handleJoin}
                    className="w-full rounded-lg bg-[#BFFF00] py-3 text-sm font-bold text-black disabled:opacity-60">
                    {joining ? 'A enviar...' : 'QUERO PARTICIPAR'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="O teu nome"
                      className="w-full rounded-lg border border-[#333] bg-black px-3 py-2 text-white"
                    />
                    <button
                      type="button"
                      disabled={joining || !guestName.trim()}
                      onClick={handleJoin}
                      className="w-full rounded-lg bg-[#BFFF00] py-3 text-sm font-bold text-black disabled:opacity-60">
                      PARTICIPAR COMO CONVIDADO
                    </button>
                    <button
                      type="button"
                      onClick={() => (window.location.href = '/login')}
                      className="w-full text-center text-sm text-[#BFFF00]">
                      Entrar para gerir presença
                    </button>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="w-full rounded-lg border border-[#BFFF00] py-3 text-sm font-bold text-[#BFFF00]">
                  SAIR DA PARTIDA
                </button>
              )}
              <div className="flex items-start gap-3 text-sm text-[#888]">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-white">{match.nextMatch}</span>
              </div>
              {match.location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#888]" />
                  <span className="text-white">{match.location}</span>
                </div>
              )}
              {organizerName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[#888]" />
                  <span className="text-white">{organizerName}</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex gap-6 border-b border-[#2a2a2a]">
            {(['INFO', 'JOGADORES'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-bold tracking-wide ${
                  tab === t
                    ? 'border-b-2 border-[#BFFF00] text-[#BFFF00]'
                    : 'text-[#888]'
                }`}>
                {t === 'INFO' ? 'CONFIRMADOS' : 'JOGADORES'}
              </button>
            ))}
          </div>

          {tab === 'INFO' && (
            <div>
              <div className="mb-6 rounded-xl border border-[#BFFF00]/30 bg-[#1A1A1A] p-4">
                <p className="text-sm text-[#ccc]">
                  <span className="font-bold text-[#BFFF00]">{dentro.length}</span> confirmados
                  {' · '}
                  <span className="font-bold text-white">{doc?.spots ?? match.spots}</span> vagas
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: doc?.spots ?? match.spots }).map((_, i) => {
                  const p = dentro[i];
                  return (
                    <div
                      key={p?.id ?? `slot-${i}`}
                      className="flex h-[130px] w-[112px] flex-col items-center justify-center rounded-xl border border-dashed border-[#333] bg-[#1A1A1A] p-2">
                      {p ? (
                        <>
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-bold">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="truncate text-center text-xs font-semibold text-white">
                            {p.name}
                          </p>
                        </>
                      ) : (
                        <p className="text-center text-[10px] font-bold text-[#666]">VAGA LIVRE</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'JOGADORES' && (
            <ul className="space-y-2">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-[#1A1A1A] px-4 py-3">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-xs uppercase text-[#888]">{p.status}</span>
                </li>
              ))}
              {participants.length === 0 && (
                <p className="text-[#888]">Nenhum jogador ainda.</p>
              )}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
