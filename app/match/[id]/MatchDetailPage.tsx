'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Copy, Link2, MapPin, Pencil, Share2, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CancelOccurrenceModal } from '@/components/match/CancelOccurrenceModal';
import { EditMatchModal } from '@/components/match/EditMatchModal';
import { GuestJoinModal } from '@/components/match/GuestJoinModal';
import {
  AttendanceProgress,
  MatchSlotsGrid,
  PendingSection,
  PlayerSection,
  sectionAccent,
} from '@/components/match/MatchDetailSections';
import { OccurrenceAttendancePanel } from '@/components/match/OccurrenceAttendancePanel';
import { ParticipantManageSheet } from '@/components/match/ParticipantManageSheet';
import { MatchDetailSkeleton } from '@/components/ui/Skeleton';
import { useMatchDetail } from '@/lib/hooks/useMatchDetail';
import { useAuth } from '@/lib/auth/context';
import type { MatchDocument } from '@/lib/models/match-document';
import type { MatchPrivacy } from '@/lib/models/match';

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
  const vm = useMatchDetail(matchId, inviteCode);
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('INFO');
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (!vm.canManage && tab === 'JOGADORES') {
      setTab('INFO');
    }
  }, [vm.canManage, tab]);

  if (vm.loading) {
    return <MatchDetailSkeleton />;
  }

  if (vm.accessBlocked || vm.loadError || !vm.match) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="mb-4 text-white">
          {vm.accessBlocked
            ? 'Esta partida é só para convidados. Usa o link da semana ou o convite da pelada.'
            : vm.loadError || 'Partida não encontrada'}
        </p>
        {vm.seriesId && (
          <Link
            href={`/series/${vm.seriesId}`}
            className="mb-4 block text-sm font-bold text-lime">
            Ver pelada do grupo
          </Link>
        )}
        {vm.isGuestViewer ? (
          <Link href="/login" className="text-lime">
            Entrar com conta
          </Link>
        ) : vm.guestInvitePath ? (
          <Link href={vm.guestInvitePath} className="text-lime">
            Voltar à partida
          </Link>
        ) : (
          <Link href="/explore" className="text-lime">
            Voltar ao explorar
          </Link>
        )}
      </div>
    );
  }

  const { match, doc } = vm;
  const subtitle = [doc ? SPORT_LABEL[doc.sport] : '', doc?.gameType].filter(Boolean).join(' • ');
  const canInvite = vm.canShare && !!doc?.inviteCode;
  const isCancelled = doc?.matchStatus === 'cancelled';

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <GuestJoinModal
        open={vm.guestJoinOpen}
        onClose={() => vm.setGuestJoinOpen(false)}
        onSubmit={vm.handleGuestJoin}
      />

      {doc && (
        <EditMatchModal
          open={editOpen}
          matchId={matchId}
          doc={doc}
          confirmedCount={vm.confirmed}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            void vm.reload();
          }}
        />
      )}

      <CancelOccurrenceModal
        open={cancelOpen}
        busy={vm.managing}
        onClose={() => setCancelOpen(false)}
        onConfirm={(note) => {
          void vm.handleCancelOccurrence(note).then(() => setCancelOpen(false));
        }}
      />

      {vm.shareFeedback && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[200] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-lime px-4 py-2 text-center text-sm font-bold text-black shadow-lg md:bottom-6">
          {vm.shareFeedback}
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[340px]">
          <div className="overflow-hidden rounded-2xl bg-card">
            <div
              className="relative h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${match.image ?? FIELD_IMAGE})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-0 p-4">
                {isCancelled && (
                  <span className="mb-1 inline-block rounded bg-danger/20 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">
                    Cancelada
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white">{match.title}</h1>
                {subtitle && <p className="text-sm text-dim">{subtitle}</p>}
                {vm.seriesId && (
                  <Link
                    href={`/series/${vm.seriesId}`}
                    className="mt-2 inline-block text-xs font-bold text-lime">
                    Ver pelada fixa →
                  </Link>
                )}
              </div>
            </div>
            <JoinActions
              vm={vm}
              hasUser={!!user}
              canInvite={canInvite}
              onLogin={() => router.push('/login')}
            />
            {vm.canManage && (
              <div className="space-y-2 px-4 pb-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-bold text-white hover:border-[#555]">
                  <Pencil className="h-4 w-4 text-lime" />
                  EDITAR {vm.seriesId ? 'ESTA SEMANA' : 'PARTIDA'}
                </button>
                {vm.seriesId && doc?.matchStatus !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={vm.managing}
                    onClick={() => setCancelOpen(true)}
                    className="flex w-full items-center justify-center rounded-lg border border-danger/50 py-2.5 text-sm font-bold text-danger disabled:opacity-50">
                    CANCELAR ESTA SEMANA
                  </button>
                )}
              </div>
            )}
            <MatchMeta
              match={match}
              organizerName={vm.organizerName}
              inviteCode={vm.canShare ? doc?.inviteCode : undefined}
              onCopyCode={vm.handleCopyInviteCode}
            />
            {doc && <MatchDetails doc={doc} isGuest={vm.isGuestViewer} onLogin={() => router.push('/login')} />}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <TabBar tab={tab} setTab={setTab} showPlayersTab={vm.canManage} />
          {tab === 'INFO' && (
            <>
              {vm.canMarkOccurrenceAttendance && (
                <>
                  <OccurrenceAttendancePanel
                    myStatus={vm.myAttendanceStatus}
                    summary={vm.attendanceSummary}
                    busy={vm.attendanceBusy}
                    onSetStatus={(s) => void vm.handleSetAttendance(s)}
                  />
                  {vm.actionError && (
                    <p className="-mt-4 mb-4 text-sm text-red-400">{vm.actionError}</p>
                  )}
                </>
              )}
              <InfoTab vm={vm} organizerUid={vm.organizerUid} userId={user?.uid} />
            </>
          )}
          {tab === 'JOGADORES' && (
            <PlayersTab vm={vm} userId={user?.uid} />
          )}
        </main>
      </div>
    </div>
  );
}

function JoinActions({
  vm,
  hasUser,
  canInvite,
  onLogin,
}: {
  vm: ReturnType<typeof useMatchDetail>;
  hasUser: boolean;
  canInvite: boolean;
  onLogin: () => void;
}) {
  return (
    <div className="space-y-2 p-4">
      {vm.actionError && <p className="text-xs text-red-400">{vm.actionError}</p>}

      {vm.canManage ? (
        <div className="rounded-lg border border-lime/40 bg-lime/10 py-3 text-center text-sm font-bold text-lime">
          {vm.isOrganizer ? 'Você é o organizador' : 'Você é admin desta partida'}
        </div>
      ) : vm.isGuestViewer && vm.canGuestJoin ? (
        <button
          type="button"
          disabled={vm.joining}
          onClick={() => vm.openGuestJoin()}
          className="w-full rounded-lg bg-lime py-3 text-sm font-bold text-black disabled:opacity-60">
          {vm.joining ? 'A enviar...' : 'ENTRAR SÓ COM O MEU NOME'}
        </button>
      ) : !vm.isJoined ? (
        <button
          type="button"
          disabled={vm.joining}
          onClick={() => void vm.handleRequestToJoin()}
          className="w-full rounded-lg bg-lime py-3 text-sm font-bold text-black disabled:opacity-60">
          {vm.joining
            ? 'A enviar...'
            : vm.seriesId
              ? 'ENTRAR NA PELADA'
              : 'QUERO PARTICIPAR'}
        </button>
      ) : vm.isPendingApproval ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-bold text-muted">
          <Clock className="h-4 w-4" />
          AGUARDANDO APROVAÇÃO
        </div>
      ) : vm.viewerJoined && hasUser ? (
        <button
          type="button"
          onClick={() => void vm.handleLeave()}
          className="w-full rounded-lg border border-lime py-3 text-sm font-bold text-lime">
          {vm.seriesId ? 'SAIR DA PELADA' : 'SAIR DA PARTIDA'}
        </button>
      ) : null}

      {canInvite && (
        <button
          type="button"
          onClick={() => void vm.handleShareInvite()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white py-3 text-sm font-bold text-white">
          <Share2 className="h-4 w-4" />
          CONVIDAR
        </button>
      )}

      {vm.isGuestViewer && (
        <p className="text-center text-sm text-muted">
          Já tens conta?{' '}
          <button
            type="button"
            onClick={onLogin}
            className="font-semibold text-lime">
            Entrar
          </button>
        </p>
      )}
    </div>
  );
}

function MatchMeta({
  match,
  organizerName,
  inviteCode,
  onCopyCode,
}: {
  match: { nextMatch: string; location?: string };
  organizerName: string;
  inviteCode?: string;
  onCopyCode: () => void;
}) {
  return (
    <>
      <div className="flex items-start gap-3 px-4 pb-3 text-sm text-muted">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="text-white">{match.nextMatch}</span>
      </div>
      {match.location && (
        <div className="flex items-start gap-3 px-4 pb-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <span className="text-white">{match.location}</span>
        </div>
      )}
      {organizerName && (
        <div className="flex items-center gap-3 px-4 pb-3 text-sm">
          <User className="h-4 w-4 text-muted" />
          <span className="text-white">{organizerName}</span>
        </div>
      )}
      {inviteCode && (
        <button
          type="button"
          onClick={() => void onCopyCode()}
          className="mx-4 mb-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-line bg-black px-3 py-2 text-left">
          <Link2 className="h-4 w-4 shrink-0 text-lime" />
          <span className="flex-1 font-mono text-sm font-bold tracking-widest text-lime">
            {inviteCode}
          </span>
          <Copy className="h-4 w-4 shrink-0 text-lime" />
        </button>
      )}
    </>
  );
}

const PRIVACY_LABEL: Record<MatchPrivacy, string> = {
  public: 'Público',
  'friends-of-friends': 'Amigos de amigos',
  friends: 'Amigos',
  'invite-only': 'Apenas convidados',
};

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function MatchDetails({
  doc,
  isGuest = false,
  onLogin,
}: {
  doc: MatchDocument;
  isGuest?: boolean;
  onLogin?: () => void;
}) {
  const description =
    doc.description?.trim() ||
    'Sem descrição adicional. Usa o convite para chamar jogadores e gerir a lista.';

  if (isGuest) {
    return (
      <div className="space-y-4 border-t border-elevated px-4 pb-4 pt-4">
        <div>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-muted">DESCRIÇÃO</h3>
          <p className="text-sm leading-relaxed text-dim">{description}</p>
        </div>
        <div>
          <dl className="space-y-2.5">
            <DetailRow label="Preço avulso" value={formatMoney(doc.pricePerGame)} />
          </dl>
        </div>
        <button
          type="button"
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-semibold text-white hover:border-[#555]">
          Entrar para ver todos os detalhes
        </button>
      </div>
    );
  }

  const typeLabel = doc.type === 'weekly' ? 'Grupo semanal' : 'Jogo avulso';

  return (
    <div className="space-y-4 border-t border-elevated px-4 pb-4 pt-4">
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-muted">DESCRIÇÃO</h3>
        <p className="text-sm leading-relaxed text-dim">{description}</p>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold tracking-wider text-muted">DETALHES</h3>
        <dl className="space-y-2.5">
          <DetailRow label="Tipo" value={typeLabel} />
          <DetailRow label="Modalidade" value={SPORT_LABEL[doc.sport] ?? doc.sport} />
          <DetailRow label="Tipo de quadra" value={doc.gameType} />
          <DetailRow label="Duração" value={doc.duration} />
          <DetailRow label="Intensidade" value={doc.intensity} />
          <DetailRow label="Faixa etária" value={`${doc.ageMin} – ${doc.ageMax} anos`} />
          <DetailRow label="Privacidade" value={PRIVACY_LABEL[doc.privacy]} />
          <DetailRow label="Preço avulso" value={formatMoney(doc.pricePerGame)} />
          {doc.type === 'weekly' && (
            <DetailRow label="Preço mensal" value={formatMoney(doc.priceMonthly)} />
          )}
          <DetailRow label="Vagas" value={String(doc.spots)} />
        </dl>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-elevated pb-2 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}

function TabBar({
  tab,
  setTab,
  showPlayersTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  showPlayersTab: boolean;
}) {
  const tabs: Tab[] = showPlayersTab ? ['INFO', 'JOGADORES'] : ['INFO'];
  return (
    <div className="mb-6 flex gap-6 border-b border-elevated">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`pb-3 text-sm font-bold tracking-wide ${
            tab === t ? 'border-b-2 border-lime text-lime' : 'text-muted'
          }`}>
          {t === 'INFO' ? 'CONFIRMADOS' : 'JOGADORES'}
        </button>
      ))}
    </div>
  );
}

const GUEST_STATUS_CONFIG = {
  'aguardando-aprovacao': {
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/10',
    dot: 'bg-yellow-400',
    label: 'Aguardando aprovação',
    message: 'O organizador irá confirmar (ou não) a tua vaga em breve.',
  },
  dentro: {
    border: 'border-lime/40',
    bg: 'bg-lime/10',
    dot: 'bg-lime',
    label: 'Confirmado!',
    message: 'A tua vaga está confirmada. Bora jogar!',
  },
  convidado: {
    border: 'border-lime/40',
    bg: 'bg-lime/10',
    dot: 'bg-lime',
    label: 'Convidado',
    message: 'Estás na lista como convidado desta partida.',
  },
  'lista-espera': {
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
    label: 'Lista de espera',
    message: 'Estás na fila. Avisamos quando abrir uma vaga.',
  },
  fora: {
    border: 'border-danger/40',
    bg: 'bg-danger/10',
    dot: 'bg-danger',
    label: 'Não aprovado',
    message: 'A tua solicitação não foi aceite pelo organizador.',
  },
} satisfies Partial<Record<import('@/lib/models/match-document').ParticipantStatus, {
  border: string; bg: string; dot: string; label: string; message: string;
}>>;

function GuestRequestStatus({
  status,
}: {
  status: import('@/lib/models/match-document').ParticipantStatus | null;
}) {
  const cfg = status ? GUEST_STATUS_CONFIG[status as keyof typeof GUEST_STATUS_CONFIG] : null;
  if (!cfg) return null;

  return (
    <div className={`rounded-xl border p-5 ${cfg.border} ${cfg.bg}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
        <span className="text-sm font-bold text-white">{cfg.label}</span>
      </div>
      <p className="text-sm leading-relaxed text-dim">{cfg.message}</p>
    </div>
  );
}

function InfoTab({
  vm,
  organizerUid,
  userId,
}: {
  vm: ReturnType<typeof useMatchDetail>;
  organizerUid?: string;
  userId?: string;
}) {
  // Guests who have already submitted a join request see only their status —
  // the players grid and capacity bar are not relevant to them.
  if (vm.isGuestViewer && vm.isJoined) {
    return (
      <div>
        <GuestRequestStatus status={vm.myStatus} />
      </div>
    );
  }

  return (
  <div>
    {vm.isGuestViewer && vm.canGuestJoin && (
      <div className="mb-6 rounded-xl border border-lime/35 bg-lime/5 p-4">
        <p className="mb-3 text-sm text-white">
          Entra na lista desta partida só com o teu nome — sem criar conta.
        </p>
        <button
          type="button"
          onClick={() => vm.openGuestJoin()}
          className="w-full rounded-lg bg-lime py-3 text-sm font-bold text-black">
          Entrar só com o meu nome
        </button>
      </div>
    )}

    <AttendanceProgress
      confirmed={vm.confirmed}
      spots={vm.spots}
      remaining={vm.remaining}
      progressPercent={vm.progressPercent}
    />

    {!vm.canSeeParticipantNames && !vm.isGuestViewer && !vm.canManage && (
      <p className="mb-4 text-sm text-muted">
        A lista completa de jogadores é visível apenas para o organizador e admins.
      </p>
    )}

    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-white">Jogadores confirmados</h2>
      {vm.canShare && (
        <button
          type="button"
          onClick={() => void vm.handleSharePlayersList()}
          className="text-xs font-bold text-lime">
          COMPARTILHAR LISTA
        </button>
      )}
    </div>

    <MatchSlotsGrid
      spots={vm.spots}
      filledCount={vm.confirmed}
      players={vm.dentroList}
      canSeeNames={vm.canSeeParticipantNames}
      organizerUid={organizerUid}
      isOrganizerViewer={vm.isOrganizer}
      currentUserId={userId}
      viewerParticipantId={vm.viewerParticipantId}
    />
  </div>
  );
}

function PlayersTab({
  vm,
  userId,
}: {
  vm: ReturnType<typeof useMatchDetail>;
  userId?: string;
}) {
  const [manageId, setManageId] = useState<string | null>(null);
  const managedPlayer = manageId
    ? vm.participants.find((p) => p.id === manageId) ?? null
    : null;

  const managedIsAdmin =
    !!managedPlayer?.uid && vm.organizerUids.includes(managedPlayer.uid);
  const managedCanPromote =
    !!managedPlayer?.uid && !managedIsAdmin;
  const managedCanDemote = managedIsAdmin && vm.organizerUids.length > 1;

  const playerSectionProps = {
    isOrganizer: vm.canManage,
    currentUserId: userId,
    viewerParticipantId: vm.viewerParticipantId,
    onTogglePaid: (id: string) => void vm.handleTogglePaid(id),
    onManagePlayer: vm.canManage ? (id: string) => setManageId(id) : undefined,
    organizerUids: vm.organizerUids,
  };

  if (vm.isGuestViewer && !vm.canSeeParticipantNames) {
    return (
      <div>
        <AttendanceProgress
          confirmed={vm.confirmed}
          spots={vm.spots}
          remaining={vm.remaining}
          progressPercent={vm.progressPercent}
        />
        <MatchSlotsGrid
          spots={vm.spots}
          filledCount={vm.confirmed}
          players={[]}
          canSeeNames={false}
        />
      </div>
    );
  }

  const empty =
    vm.dentroList.length === 0 &&
    vm.esperaList.length === 0 &&
    vm.foraList.length === 0 &&
    vm.aguardandoList.length === 0;

  return (
    <div>
      <ParticipantManageSheet
        open={!!managedPlayer}
        player={managedPlayer}
        currentStatus={managedPlayer?.status ?? null}
        onClose={() => setManageId(null)}
        busy={vm.managing}
        showAdminControls={vm.canManage}
        isAdmin={managedIsAdmin}
        canPromoteAdmin={managedCanPromote}
        canDemoteAdmin={managedCanDemote}
        onMoveStatus={(status) => {
          if (!managedPlayer) return;
          void vm.handleMoveParticipant(managedPlayer.id, status).then(() => setManageId(null));
        }}
        onTogglePaid={() => {
          if (!managedPlayer) return;
          void vm.handleTogglePaid(managedPlayer.id);
        }}
        onPromoteAdmin={() => {
          if (!managedPlayer?.uid) return;
          void vm.handleAddOrganizer(managedPlayer.uid);
        }}
        onDemoteAdmin={() => {
          if (!managedPlayer?.uid) return;
          void vm.handleRemoveOrganizer(managedPlayer.uid);
        }}
        onRemove={() => {
          if (!managedPlayer) return;
          void vm.handleRemoveParticipant(managedPlayer.id).then(() => setManageId(null));
        }}
      />

      {vm.actionError && <p className="mb-4 text-sm text-red-400">{vm.actionError}</p>}

      {vm.canShare && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void vm.handleShareInvite()}
            disabled={!vm.doc?.inviteCode}
            className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg border-2 border-lime py-2.5 text-sm font-bold text-lime disabled:opacity-40">
            <Share2 className="h-4 w-4" />
            Convidar jogadores
          </button>
          <button
            type="button"
            onClick={() => void vm.handleSharePlayersList()}
            className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg border-2 border-lime py-2.5 text-sm font-bold text-lime">
            <Share2 className="h-4 w-4" />
            Compartilhar lista
          </button>
        </div>
      )}

      {vm.canManage && (
        <PendingSection
          players={vm.aguardandoList}
          onApprove={(id) => void vm.handleApproveParticipant(id)}
          onReject={(id) => void vm.handleRejectParticipant(id)}
        />
      )}

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
      {empty && <p className="py-8 text-center text-muted">Nenhum jogador ainda.</p>}
    </div>
  );
}
