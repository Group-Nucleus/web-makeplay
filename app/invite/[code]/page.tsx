'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { inputClass } from '@/components/ui/Field';
import type { InviteIndexDto } from '@/lib/api/types/match';
import type { ParticipantStatus } from '@/lib/models/match-document';
import {
  getInviteByCode,
  joinMatchAsGuest,
  normalizeInviteIndexId,
} from '@/lib/repositories/match';
import {
  setGuestParticipant,
  setPendingGuestClaimToken,
} from '@/lib/storage/guestParticipant';
import { matchPathWithCode, seriesPathWithCode } from '@/lib/guestRoutes';
import { setGuestInviteContext } from '@/lib/storage/guestInvite';

const SPORT_LABEL: Record<string, string> = {
  soccer: 'Futebol',
  volleyball: 'Vôlei',
  basketball: 'Basquete',
  tennis: 'Tênis',
  'beach-tennis': 'Beach Tennis',
  kart: 'Kart',
  swimming: 'Natação',
  padel: 'Padel',
};

const STATUS_LABEL: Partial<Record<ParticipantStatus, string>> = {
  dentro: 'Confirmado',
  'lista-espera': 'Lista de espera',
  'aguardando-aprovacao': 'Aguardando aprovação',
  fora: 'Não aprovado',
};

type Phase = 'loading' | 'error' | 'form' | 'series' | 'joined';

interface JoinResult {
  name: string;
  status: ParticipantStatus;
}

function StatusInfo({ status }: { status: ParticipantStatus }) {
  if (status === 'dentro') {
    return (
      <div className="rounded-xl border border-lime/40 bg-lime/10 p-4">
        <p className="text-sm text-white">A tua vaga está confirmada. Bora jogar!</p>
      </div>
    );
  }
  if (status === 'aguardando-aprovacao') {
    return (
      <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
        <p className="text-sm text-white">
          O organizador irá confirmar (ou não) a tua vaga em breve.
        </p>
      </div>
    );
  }
  if (status === 'lista-espera') {
    return (
      <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
        <p className="text-sm text-white">Estás na fila. Avisamos quando abrir uma vaga.</p>
      </div>
    );
  }
  return null;
}

function InvitePreviewCard({ invite }: { invite: InviteIndexDto }) {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-card p-5">
      <span className="mb-3 inline-block rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-bold text-lime">
        {invite.type === 'weekly' ? 'PELADA FIXA' : 'JOGO AVULSO'}
      </span>
      <h1 className="mb-4 text-xl font-bold text-white">{invite.name}</h1>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 text-sm text-dim">
          <span className="w-4 text-center text-muted">⚽</span>
          <span>{SPORT_LABEL[invite.sport] ?? invite.sport}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-dim">
          <Calendar className="h-4 w-4 shrink-0 text-muted" />
          <span>
            {invite.day} · {invite.startTime}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-dim">
          <MapPin className="h-4 w-4 shrink-0 text-muted" />
          <span>{invite.location}</span>
        </div>
        {invite.participantStatsPreview != null && (
          <div className="flex items-center gap-3 text-sm text-dim">
            <span className="w-4 text-center text-muted">👥</span>
            <span>
              {invite.participantStatsPreview.dentroCount} / {invite.spots} confirmados
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  const params = useParams<{ code: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [invite, setInvite] = useState<InviteIndexDto | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [joined, setJoined] = useState<JoinResult | null>(null);

  useEffect(() => {
    const code = normalizeInviteIndexId(params.code);
    if (!code) {
      setErrorMsg('Código de convite inválido.');
      setPhase('error');
      return;
    }

    void (async () => {
      const row = await getInviteByCode(code);
      if (!row) {
        setErrorMsg('Convite não encontrado ou expirado.');
        setPhase('error');
        return;
      }

      setInvite(row);

      if (row.target === 'series' && row.seriesId) {
        setGuestInviteContext({ target: 'series', seriesId: row.seriesId, code });
        setPhase('series');
      } else if (row.matchId) {
        setGuestInviteContext({ target: 'match', matchId: row.matchId, code });
        setPhase('form');
      } else {
        setErrorMsg('Convite inválido. Confirma o link com quem te convidou.');
        setPhase('error');
      }
    })();
  }, [params.code]);

  const handleJoin = async () => {
    if (!invite?.matchId || name.trim().length < 2 || submitting) return;
    setSubmitError('');
    setSubmitting(true);
    const code = normalizeInviteIndexId(params.code);
    try {
      const participant = await joinMatchAsGuest(invite.matchId, name.trim(), code || undefined);
      setGuestParticipant(invite.matchId, {
        participantId: participant.id,
        name: participant.name,
        status: participant.status,
        guestToken: participant.guestToken ?? undefined,
      });
      if (participant.guestToken) setPendingGuestClaimToken(participant.guestToken);
      setJoined({ name: participant.name, status: participant.status });
      setPhase('joined');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const code = normalizeInviteIndexId(params.code);
  const matchPath =
    invite?.matchId ? matchPathWithCode(invite.matchId, code) : null;
  const seriesPath =
    invite?.seriesId ? seriesPathWithCode(invite.seriesId, code) : null;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex items-center gap-3 px-6 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime text-sm font-black text-black">
          B
        </span>
        <span className="text-sm font-extrabold tracking-widest text-lime">BORAPLAY</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {phase === 'loading' && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center">
              <p className="mb-4 text-white">{errorMsg}</p>
              <p className="mb-6 max-w-sm text-sm text-muted">
                Confirma o link com quem te convidou. O endereço deve ser algo como{' '}
                <span className="text-lime">/invite/ABC123</span>.
              </p>
              <Link href="/login" className="text-sm font-bold text-lime">
                Entrar com conta
              </Link>
            </div>
          )}

          {(phase === 'form' || phase === 'series') && invite && (
            <>
              <InvitePreviewCard invite={invite} />

              {phase === 'series' ? (
                <>
                  <p className="mb-6 text-center text-sm leading-relaxed text-muted">
                    Esta é uma pelada fixa. Para entrar na lista precisas de uma conta.
                  </p>
                  <Link
                    href="/login"
                    className="mb-3 block w-full rounded-xl bg-lime py-3.5 text-center text-sm font-bold text-black">
                    ENTRAR COM CONTA
                  </Link>
                  {seriesPath && (
                    <Link
                      href={seriesPath}
                      className="block w-full rounded-xl border border-line py-3.5 text-center text-sm font-semibold text-white">
                      Ver detalhes
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-bold tracking-wider text-muted">
                      O TEU NOME
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleJoin();
                      }}
                      autoFocus
                    />
                  </div>

                  {submitError && <p className="mb-3 text-sm text-red-400">{submitError}</p>}

                  <button
                    type="button"
                    disabled={name.trim().length < 2 || submitting}
                    onClick={() => void handleJoin()}
                    className="mb-6 w-full rounded-xl bg-lime py-3.5 text-sm font-bold text-black disabled:opacity-50">
                    {submitting ? 'A enviar...' : 'ENTRAR NA LISTA'}
                  </button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-line" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black px-2 text-muted">ou</span>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="block w-full rounded-xl border border-line py-3.5 text-center text-sm font-semibold text-white">
                    ENTRAR COM CONTA
                  </Link>
                  <p className="mt-3 text-center text-xs text-muted">
                    Com conta vês todos os detalhes, geris as tuas peladas e muito mais.
                  </p>
                </>
              )}
            </>
          )}

          {phase === 'joined' && joined && invite && (
            <div className="text-center">
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime/15">
                  <span className="text-2xl text-lime">✓</span>
                </div>
                <h2 className="text-xl font-bold text-white">Pedido enviado!</h2>
                <p className="text-sm text-muted">
                  {joined.name} · {STATUS_LABEL[joined.status] ?? joined.status}
                </p>
              </div>

              <StatusInfo status={joined.status} />

              {matchPath && (
                <Link
                  href={matchPath}
                  className="mt-6 block w-full rounded-xl border border-line py-3.5 text-center text-sm font-semibold text-white">
                  Ver detalhes da partida
                </Link>
              )}

              <Link
                href="/login"
                className="mt-3 block w-full rounded-xl bg-lime py-3.5 text-center text-sm font-bold text-black">
                CRIAR CONTA
              </Link>
              <p className="mt-3 text-xs text-muted">
                Cria conta para gerir as tuas peladas e receber notificações.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
