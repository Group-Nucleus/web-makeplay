'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MatchDetailSkeleton } from '@/components/ui/Skeleton';
import {
  ChevronRight,
  Copy,
  DollarSign,
  History,
  Link2,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { OccurrenceAttendancePanel } from '@/components/match/OccurrenceAttendancePanel';
import { PlayerSection, sectionAccent } from '@/components/match/MatchDetailSections';
import { useSeriesDetail } from '@/lib/hooks/useSeriesDetail';
import { useAuth } from '@/lib/auth/context';
import type { OccurrenceAttendanceDto } from '@/lib/api/types/match';
import { matchPathWithCode } from '@/lib/guestRoutes';
import { getMatchDetail } from '@/lib/repositories/match';
import { joinSeries, setOccurrenceAttendance } from '@/lib/repositories/match-series';
import {
  ensureSeriesMembershipInRoster,
  isSeriesMembershipRequiredError,
} from '@/lib/utils/seriesMembership';
import { formatMatchSchedule } from '@/lib/mappers/match';
import type { SeriesOccurrenceDto } from '@/lib/api/types/match-series';

const FIELD_IMAGE =
  'https://images.pexels.com/photos/36958045/pexels-photo-36958045.jpeg';

type Panel = 'main' | 'members' | 'past';

export function SeriesDetailPage({
  seriesId,
  inviteCode,
}: {
  seriesId: string;
  inviteCode?: string;
}) {
  const router = useRouter();
  const vm = useSeriesDetail(seriesId, inviteCode);
  const { user } = useAuth();
  const [panel, setPanel] = useState<Panel>('main');
  const [nextAttendance, setNextAttendance] = useState<OccurrenceAttendanceDto | null>(null);
  const [nextAttendanceBusy, setNextAttendanceBusy] = useState(false);
  const [nextAttendanceError, setNextAttendanceError] = useState('');

  const nextOccurrence = useMemo(
    () => pickNextOccurrence(vm.occurrences),
    [vm.occurrences],
  );

  const pastOccurrences = useMemo(
    () => pickPastOccurrences(vm.occurrences),
    [vm.occurrences],
  );

  const nextSchedule = nextOccurrence
    ? formatMatchSchedule(
        nextOccurrence.day,
        vm.doc?.startTime ?? '',
        vm.doc?.duration ?? '',
      )
    : vm.match?.nextMatch ?? '';

  const canMarkNextAttendance =
    !!user &&
    !vm.isGuestViewer &&
    vm.isJoined &&
    !vm.isPendingApproval &&
    !!nextOccurrence;

  const statusLabel = canMarkNextAttendance ? null : memberStatusLabel(vm);

  useEffect(() => {
    if (!nextOccurrence?.id || !user) {
      setNextAttendance(null);
      return;
    }
    let cancelled = false;
    void getMatchDetail(nextOccurrence.id, inviteCode).then((detail) => {
      if (!cancelled) setNextAttendance(detail.attendance ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [nextOccurrence?.id, user, inviteCode]);

  const handleSetNextAttendance = async (status: 'vou' | 'nao-vou') => {
    if (!nextOccurrence?.id) return;
    setNextAttendanceBusy(true);
    setNextAttendanceError('');
    try {
      await ensureSeriesMembershipInRoster(seriesId, {
        isParticipant: vm.isParticipant,
        autoJoinAsMember: vm.canManage,
      });
      try {
        await setOccurrenceAttendance(nextOccurrence.id, status);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (isSeriesMembershipRequiredError(msg) && vm.canManage) {
          await joinSeries(seriesId, 'dentro');
          await setOccurrenceAttendance(nextOccurrence.id, status);
        } else {
          throw e;
        }
      }
      const detail = await getMatchDetail(nextOccurrence.id, inviteCode);
      setNextAttendance(detail.attendance ?? null);
      void vm.reload();
    } catch (e) {
      setNextAttendanceError(
        e instanceof Error ? e.message : 'Erro ao atualizar presença',
      );
    } finally {
      setNextAttendanceBusy(false);
    }
  };

  useEffect(() => {
    if (!vm.canManage && panel !== 'main') {
      setPanel('main');
    }
  }, [vm.canManage, panel]);

  if (vm.loading) {
    return <MatchDetailSkeleton />;
  }

  if (vm.accessBlocked || vm.error || !vm.match || !vm.doc) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="mb-4 text-white">
          {vm.accessBlocked
            ? 'Esta pelada é só para convidados. Pede o link ou código a quem te convidou.'
            : vm.error || 'Pelada não encontrada'}
        </p>
        {vm.isGuestViewer ? (
          <Link href="/login" className="text-sm font-bold text-lime">
            Entrar com conta
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm font-bold text-lime">
            Voltar ao início
          </button>
        )}
      </div>
    );
  }

  const { match, doc } = vm;
  const playerSectionProps = {
    isOrganizer: vm.canManage,
    currentUserId: user?.uid,
    viewerParticipantId: vm.viewerParticipantId,
    onTogglePaid: () => {},
    organizerUids: vm.organizerUids,
  };

  const membersContent = (
    <>
      <PlayerSection
        title="DENTRO"
        players={vm.dentroList}
        accent={sectionAccent('dentro')}
        {...playerSectionProps}
      />
      <PlayerSection
        title="LISTA DE ESPERA"
        players={vm.esperaList}
        accent={sectionAccent('lista-espera')}
        {...playerSectionProps}
      />
      <PlayerSection
        title="FORA"
        players={vm.foraList}
        accent={sectionAccent('fora')}
        {...playerSectionProps}
      />
      <PlayerSection
        title="CONVIDADOS"
        players={vm.convidadoList}
        accent={sectionAccent('convidado')}
        {...playerSectionProps}
      />
    </>
  );

  const pastContent =
    pastOccurrences.length === 0 ? (
      <p className="py-12 text-center text-sm text-muted">Ainda não há jogos passados.</p>
    ) : (
      <ul className="grid gap-2 sm:grid-cols-2">
        {pastOccurrences.map((o) => (
          <li key={o.id}>
            <Link
              href={matchPathWithCode(o.id, o.inviteCode)}
              className="flex items-center justify-between rounded-xl bg-card px-4 py-3 hover:bg-[#222]">
              <div>
                <p className="font-medium text-white">{o.day}</p>
                <p className="text-xs text-muted">{occurrenceStatusLabel(o.status)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666]" />
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      {vm.shareFeedback && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-200 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-lime px-4 py-2 text-center text-sm font-bold text-black shadow-lg md:bottom-6">
          {vm.shareFeedback}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        {/* Coluna esquerda: identidade da pelada */}
        <aside className="w-full shrink-0 lg:w-[300px] xl:w-[320px]">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-elevated bg-[#121212] p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-lime">
                Pelada fixa
              </p>
              <div className="mb-5 flex items-start gap-3">
                <div
                  className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-line"
                  style={{ backgroundImage: `url(${match.image ?? FIELD_IMAGE})` }}
                  role="img"
                  aria-label={match.title}
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold leading-tight text-white">{match.title}</h1>
                  {vm.organizerName && (
                    <p className="mt-1 text-xs text-muted">Presidente: {vm.organizerName}</p>
                  )}
                </div>
              </div>

              <SeriesSidebarActions vm={vm} hasUser={!!user} />

            <div className="mt-4 space-y-2 border-t border-elevated pt-4 text-sm">
              {match.location && (
                <p className="text-muted">
                  {match.distance ? `${match.distance} • ` : ''}
                  {match.location}
                </p>
              )}
              <p className="text-muted">
                Toda {doc.day} · {doc.startTime}
              </p>
              {vm.canManage && doc.inviteCode && (
                <button
                  type="button"
                  onClick={() => void vm.handleCopyInviteCode()}
                  className="flex w-full items-center gap-2 rounded-lg border border-line bg-black px-3 py-2 text-left">
                  <Link2 className="h-4 w-4 shrink-0 text-lime" />
                  <span className="flex-1 font-mono text-sm font-bold tracking-widest text-lime">
                    {doc.inviteCode}
                  </span>
                  <Copy className="h-4 w-4 shrink-0 text-lime" />
                </button>
              )}
            </div>
            </div>
          </div>

          {vm.isGuestViewer && (
            <p className="mt-4 text-center text-sm lg:text-left">
              <Link href="/login" className="font-bold text-lime">
                Entrar com conta
              </Link>{' '}
              para gerir a tua presença
            </p>
          )}
        </aside>

        {/* Coluna direita: próximo jogo + menu / painéis */}
        <main className="min-w-0 flex-1">
          {panel !== 'main' && (
            <button
              type="button"
              onClick={() => setPanel('main')}
              className="mb-4 text-sm font-semibold text-lime lg:hidden">
              ← Voltar
            </button>
          )}

          {panel === 'members' && vm.canManage ? (
            <div>
              <h2 className="mb-4 text-xl font-bold text-white lg:text-2xl">Mensalistas</h2>
              {membersContent}
            </div>
          ) : panel === 'past' && vm.canManage ? (
            <div>
              <h2 className="mb-4 text-xl font-bold text-white lg:text-2xl">Jogos passados</h2>
              {pastContent}
            </div>
          ) : (
            <>
              {vm.canManage && (
                <div className="mb-6 hidden justify-end lg:flex">
                  <button
                    type="button"
                    className="shrink-0 text-sm font-semibold text-lime"
                    onClick={() => void vm.handleShareInvite()}>
                    Editar
                  </button>
                </div>
              )}

              <section className="mb-8">
                <p className="mb-3 text-sm text-muted">
                  Próximo jogo
                  {vm.canManage && vm.confirmed > 0 && (
                    <span>
                      {' '}
                      · {vm.confirmed} confirmado{vm.confirmed !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>

                {nextOccurrence ? (
                  <div className="overflow-hidden rounded-2xl bg-card lg:max-w-xl">
                    <Link
                      href={matchPathWithCode(nextOccurrence.id, nextOccurrence.inviteCode)}
                      className="block transition-colors hover:bg-[#222]">
                      <div
                        className="relative aspect-16/10 bg-cover bg-center lg:aspect-2/1"
                        style={{ backgroundImage: `url(${match.image ?? FIELD_IMAGE})` }}>
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                        <p className="absolute bottom-3 left-4 text-sm font-bold text-lime">
                          Ver detalhes da semana →
                        </p>
                      </div>
                      <div className="space-y-1 p-4 sm:p-5">
                        {match.location && (
                          <p className="text-sm text-muted">
                            {match.distance ?? ''}
                            {match.distance ? ' • ' : ''}
                            {match.location}
                          </p>
                        )}
                        {nextSchedule && <p className="text-sm text-muted">{nextSchedule}</p>}
                      </div>
                    </Link>
                    <div className="border-t border-elevated px-4 pb-4 sm:px-5 sm:pb-5">
                      <NextGameStatus
                        statusLabel={statusLabel}
                        vm={vm}
                        canMarkAttendance={canMarkNextAttendance}
                        myAttendanceStatus={nextAttendance?.myStatus ?? null}
                        attendanceSummary={
                          nextAttendance?.summary ?? { vou: 0, naoVou: 0, pendente: 0 }
                        }
                        attendanceBusy={nextAttendanceBusy}
                        attendanceError={nextAttendanceError}
                        onSetAttendance={(s) => void handleSetNextAttendance(s)}
                        onJoin={() => void vm.handleRequestToJoin()}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted lg:max-w-xl">
                    Nenhuma semana agendada.
                  </p>
                )}
              </section>

              {vm.canManage ? (
                <nav className="grid gap-2 sm:grid-cols-2">
                  <MenuRow
                    icon={<Star className="h-5 w-5" />}
                    label="Ranking do ano"
                    onClick={() => {}}
                    disabled
                    hint="Em breve"
                  />
                  <MenuRow
                    icon={<Users className="h-5 w-5" />}
                    label={`${vm.confirmed} mensalista${vm.confirmed !== 1 ? 's' : ''}`}
                    onClick={() => setPanel('members')}
                  />
                  <MenuRow
                    icon={<DollarSign className="h-5 w-5" />}
                    label="Carteira"
                    trailing={formatMoney(doc.priceMonthly)}
                    onClick={() => {}}
                  />
                  <MenuRow
                    icon={<History className="h-5 w-5" />}
                    label="Jogos passados"
                    onClick={() => setPanel('past')}
                  />
                </nav>
              ) : (
                <p className="rounded-xl bg-card px-4 py-3 text-sm text-muted">
                  Lista de mensalistas, carteira e histórico são visíveis apenas para o
                  organizador e admins.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SeriesSidebarActions({
  vm,
  hasUser,
}: {
  vm: ReturnType<typeof useSeriesDetail>;
  hasUser: boolean;
}) {
  return (
    <div className="space-y-2 p-4">
      {vm.error && <p className="text-xs text-red-400">{vm.error}</p>}

      {vm.canManage ? (
        <div className="rounded-lg border border-lime/40 bg-lime/10 py-3 text-center text-sm font-bold text-lime">
          {vm.isOrganizer ? 'Você organiza esta pelada' : 'Você é admin desta pelada'}
        </div>
      ) : !vm.isJoined ? (
        !vm.isGuestViewer && (
          <button
            type="button"
            disabled={vm.joining}
            onClick={() => void vm.handleRequestToJoin()}
            className="w-full rounded-lg bg-lime py-3 text-sm font-bold text-black disabled:opacity-60">
            {vm.joining ? 'A enviar...' : 'Entrar na pelada'}
          </button>
        )
      ) : vm.isPendingApproval ? (
        <div className="rounded-lg border border-line py-3 text-center text-sm font-bold text-muted">
          Aguardando aprovação
        </div>
      ) : hasUser ? (
        <button
          type="button"
          onClick={() => void vm.handleLeave()}
          className="w-full rounded-lg border border-lime py-3 text-sm font-bold text-lime">
          Sair da pelada
        </button>
      ) : null}

      {vm.canShare && (
        <button
          type="button"
          onClick={() => void vm.handleShareInvite()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white py-3 text-sm font-bold text-white">
          <Share2 className="h-4 w-4" />
          Convidar para a pelada
        </button>
      )}

      {vm.canManage && (
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-lime lg:hidden"
          onClick={() => void vm.handleShareInvite()}>
          Editar
        </button>
      )}
    </div>
  );
}

function NextGameStatus({
  statusLabel,
  vm,
  canMarkAttendance,
  myAttendanceStatus,
  attendanceSummary,
  attendanceBusy,
  attendanceError,
  onSetAttendance,
  onJoin,
}: {
  statusLabel: string | null;
  vm: ReturnType<typeof useSeriesDetail>;
  canMarkAttendance: boolean;
  myAttendanceStatus: OccurrenceAttendanceDto['myStatus'];
  attendanceSummary: OccurrenceAttendanceDto['summary'];
  attendanceBusy: boolean;
  attendanceError?: string;
  onSetAttendance: (status: 'vou' | 'nao-vou') => void;
  onJoin: () => void;
}) {
  if (canMarkAttendance) {
    return (
      <>
        <OccurrenceAttendancePanel
          myStatus={myAttendanceStatus}
          summary={attendanceSummary}
          busy={attendanceBusy}
          onSetStatus={onSetAttendance}
          embedded
        />
        {attendanceError && (
          <p className="mt-2 text-sm text-red-400">{attendanceError}</p>
        )}
      </>
    );
  }

  return (
    <div className="pt-2">
      {statusLabel ? (
        <div className="rounded-xl bg-elevated py-3.5 text-center text-sm font-semibold text-lime">
          {statusLabel}
        </div>
      ) : !vm.isJoined && !vm.isGuestViewer ? (
        <button
          type="button"
          disabled={vm.joining}
          onClick={onJoin}
          className="w-full rounded-xl bg-lime py-3.5 text-sm font-bold text-black disabled:opacity-60">
          {vm.joining ? 'A enviar...' : 'Entrar na pelada'}
        </button>
      ) : vm.isPendingApproval ? (
        <div className="rounded-xl bg-elevated py-3.5 text-center text-sm font-semibold text-muted">
          Aguardando aprovação
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  trailing,
  hint,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 text-left transition-colors hover:bg-[#222] disabled:opacity-50 disabled:hover:bg-card">
      <span className="text-muted">{icon}</span>
      <span className="min-w-0 flex-1 font-medium text-white">{label}</span>
      {hint && <span className="text-xs text-[#666]">{hint}</span>}
      {trailing && <span className="text-sm text-muted">{trailing}</span>}
      {!disabled && <ChevronRight className="h-5 w-5 shrink-0 text-[#666]" />}
    </button>
  );
}

function pickNextOccurrence(occurrences: SeriesOccurrenceDto[]): SeriesOccurrenceDto | null {
  const now = Date.now();
  return (
    [...occurrences]
      .filter((o) => o.status !== 'cancelled' && o.status !== 'completed')
      .filter((o) => {
        const t = Date.parse(o.scheduledAt);
        return Number.isNaN(t) || t >= now - 86_400_000;
      })
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))[0] ?? null
  );
}

function pickPastOccurrences(occurrences: SeriesOccurrenceDto[]): SeriesOccurrenceDto[] {
  const now = Date.now();
  return [...occurrences]
    .filter(
      (o) =>
        o.status === 'completed' ||
        o.status === 'cancelled' ||
        Date.parse(o.scheduledAt) < now - 86_400_000,
    )
    .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));
}

function memberStatusLabel(vm: ReturnType<typeof useSeriesDetail>): string | null {
  if (vm.isOrganizer) return 'Você organiza';
  if (vm.isPendingApproval) return null;
  if (vm.myStatus === 'dentro') return 'Você está dentro';
  if (vm.myStatus === 'lista-espera') return 'Lista de espera';
  if (vm.isJoined) return 'Você está na pelada';
  return null;
}

function occurrenceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'Agendada',
    open: 'Aberta',
    cancelled: 'Cancelada',
    completed: 'Concluída',
  };
  return map[status] ?? status;
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
