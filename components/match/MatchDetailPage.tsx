'use client';

import Link from 'next/link';
import { Calendar, Clock, Copy, Link2, MapPin, Pencil, Share2, User } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [tab, setTab] = useState<Tab>('INFO');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!vm.canManage && tab === 'JOGADORES') {
      setTab('INFO');
    }
  }, [vm.canManage, tab]);

  if (vm.loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  if (vm.accessBlocked || vm.error || !vm.match) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="mb-4 text-white">
          {vm.accessBlocked
            ? 'Esta partida é só para convidados. Usa o link da semana ou o convite da pelada.'
            : vm.error || 'Partida não encontrada'}
        </p>
        {vm.seriesId && (
          <Link
            href={`/series/${vm.seriesId}`}
            className="mb-4 block text-sm font-bold text-[#BFFF00]">
            Ver pelada do grupo
          </Link>
        )}
        {vm.isGuestViewer ? (
          <Link href="/login" className="text-[#BFFF00]">
            Entrar com conta
          </Link>
        ) : vm.guestInvitePath ? (
          <Link href={vm.guestInvitePath} className="text-[#BFFF00]">
            Voltar à partida
          </Link>
        ) : (
          <Link href="/explore" className="text-[#BFFF00]">
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

      {vm.shareFeedback && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[200] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-[#BFFF00] px-4 py-2 text-center text-sm font-bold text-black shadow-lg md:bottom-6">
          {vm.shareFeedback}
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[340px]">
          <div className="overflow-hidden rounded-2xl bg-[#1A1A1A]">
            <div
              className="relative h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${match.image ?? FIELD_IMAGE})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-0 p-4">
                {isCancelled && (
                  <span className="mb-1 inline-block rounded bg-[#FF4136]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#FF4136]">
                    Cancelada
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white">{match.title}</h1>
                {subtitle && <p className="text-sm text-[#ccc]">{subtitle}</p>}
                {vm.seriesId && (
                  <Link
                    href={`/series/${vm.seriesId}`}
                    className="mt-2 inline-block text-xs font-bold text-[#BFFF00]">
                    Ver pelada fixa →
                  </Link>
                )}
              </div>
            </div>
            <JoinActions vm={vm} hasUser={!!user} canInvite={canInvite} />
            {vm.canManage && (
              <div className="space-y-2 px-4 pb-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#333] py-2.5 text-sm font-bold text-white hover:border-[#555]">
                  <Pencil className="h-4 w-4 text-[#BFFF00]" />
                  EDITAR {vm.seriesId ? 'ESTA SEMANA' : 'PARTIDA'}
                </button>
                {vm.seriesId && doc?.matchStatus !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={vm.managing}
                    onClick={() => {
                      const note = window.prompt('Motivo do cancelamento (opcional):') ?? '';
                      void vm.handleCancelOccurrence(note);
                    }}
                    className="flex w-full items-center justify-center rounded-lg border border-[#FF4136]/50 py-2.5 text-sm font-bold text-[#FF4136] disabled:opacity-50">
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
            {doc && <MatchDetails doc={doc} />}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <TabBar tab={tab} setTab={setTab} showPlayersTab={vm.canManage} />
          {tab === 'INFO' && (
            <>
              {vm.canMarkOccurrenceAttendance && (
                <OccurrenceAttendancePanel
                  myStatus={vm.myAttendanceStatus}
                  summary={vm.attendanceSummary}
                  busy={vm.attendanceBusy}
                  onSetStatus={(s) => void vm.handleSetAttendance(s)}
                />
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
}: {
  vm: ReturnType<typeof useMatchDetail>;
  hasUser: boolean;
  canInvite: boolean;
}) {
  return (
    <div className="space-y-2 p-4">
      {vm.error && <p className="text-xs text-red-400">{vm.error}</p>}

      {vm.canManage ? (
        <div className="rounded-lg border border-[#BFFF00]/40 bg-[#BFFF00]/10 py-3 text-center text-sm font-bold text-[#BFFF00]">
          {vm.isOrganizer ? 'Você é o organizador' : 'Você é admin desta partida'}
        </div>
      ) : !vm.isJoined ? (
        <button
          type="button"
          disabled={vm.joining || (vm.isGuestViewer && !vm.canGuestJoin)}
          onClick={() => void vm.handleRequestToJoin()}
          className="w-full rounded-lg bg-[#BFFF00] py-3 text-sm font-bold text-black disabled:opacity-60">
          {vm.joining
            ? 'A enviar...'
            : vm.isGuestViewer
              ? 'ENTRAR SÓ COM O MEU NOME'
              : vm.seriesId
                ? 'ENTRAR NA PELADA'
                : 'QUERO PARTICIPAR'}
        </button>
      ) : vm.isPendingApproval ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-[#333] py-3 text-sm font-bold text-[#888]">
          <Clock className="h-4 w-4" />
          AGUARDANDO APROVAÇÃO
        </div>
      ) : vm.viewerJoined && hasUser ? (
        <button
          type="button"
          onClick={() => void vm.handleLeave()}
          className="w-full rounded-lg border border-[#BFFF00] py-3 text-sm font-bold text-[#BFFF00]">
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
        <button
          type="button"
          onClick={() => (window.location.href = '/login')}
          className="w-full text-center text-sm text-[#BFFF00]">
          Entrar para gerir presença
        </button>
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
      <div className="flex items-start gap-3 px-4 pb-3 text-sm text-[#888]">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="text-white">{match.nextMatch}</span>
      </div>
      {match.location && (
        <div className="flex items-start gap-3 px-4 pb-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#888]" />
          <span className="text-white">{match.location}</span>
        </div>
      )}
      {organizerName && (
        <div className="flex items-center gap-3 px-4 pb-3 text-sm">
          <User className="h-4 w-4 text-[#888]" />
          <span className="text-white">{organizerName}</span>
        </div>
      )}
      {inviteCode && (
        <button
          type="button"
          onClick={() => void onCopyCode()}
          className="mx-4 mb-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-[#333] bg-black px-3 py-2 text-left">
          <Link2 className="h-4 w-4 shrink-0 text-[#BFFF00]" />
          <span className="flex-1 font-mono text-sm font-bold tracking-widest text-[#BFFF00]">
            {inviteCode}
          </span>
          <Copy className="h-4 w-4 shrink-0 text-[#BFFF00]" />
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

function MatchDetails({ doc }: { doc: MatchDocument }) {
  const typeLabel = doc.type === 'weekly' ? 'Grupo semanal' : 'Jogo avulso';
  const description =
    doc.description?.trim() ||
    'Sem descrição adicional. Usa o convite para chamar jogadores e gerir a lista.';

  return (
    <div className="space-y-4 border-t border-[#2a2a2a] px-4 pb-4 pt-4">
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-[#888]">DESCRIÇÃO</h3>
        <p className="text-sm leading-relaxed text-[#ccc]">{description}</p>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold tracking-wider text-[#888]">DETALHES</h3>
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
    <div className="flex justify-between gap-4 border-b border-[#2a2a2a] pb-2 text-sm last:border-0">
      <dt className="text-[#888]">{label}</dt>
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
    <div className="mb-6 flex gap-6 border-b border-[#2a2a2a]">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`pb-3 text-sm font-bold tracking-wide ${
            tab === t ? 'border-b-2 border-[#BFFF00] text-[#BFFF00]' : 'text-[#888]'
          }`}>
          {t === 'INFO' ? 'CONFIRMADOS' : 'JOGADORES'}
        </button>
      ))}
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
  return (
  <div>
    <AttendanceProgress
      confirmed={vm.confirmed}
      spots={vm.spots}
      remaining={vm.remaining}
      progressPercent={vm.progressPercent}
    />

    {!vm.canSeeParticipantNames && !vm.isGuestViewer && (
      <p className="mb-4 text-sm text-[#888]">
        A lista completa de jogadores é visível apenas para o organizador e admins.
      </p>
    )}

    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-white">Jogadores confirmados</h2>
      {vm.canShare && (
        <button
          type="button"
          onClick={() => void vm.handleSharePlayersList()}
          className="text-xs font-bold text-[#BFFF00]">
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
        <p className="mb-4 text-sm text-[#888]">
          As vagas ocupadas aparecem sem nomes. Entra com conta para ver a lista completa e
          convidar outros jogadores.
        </p>
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
    vm.convidadoList.length === 0 &&
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

      {vm.error && <p className="mb-4 text-sm text-red-400">{vm.error}</p>}

      {vm.canShare && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void vm.handleShareInvite()}
            disabled={!vm.doc?.inviteCode}
            className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#BFFF00] py-2.5 text-sm font-bold text-[#BFFF00] disabled:opacity-40">
            <Share2 className="h-4 w-4" />
            Convidar jogadores
          </button>
          <button
            type="button"
            onClick={() => void vm.handleSharePlayersList()}
            className="flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#BFFF00] py-2.5 text-sm font-bold text-[#BFFF00]">
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
      <PlayerSection
        title="CONVIDADOS"
        players={vm.convidadoList}
        accent={sectionAccent('convidado')}
        {...playerSectionProps}
      />

      {empty && <p className="py-8 text-center text-[#888]">Nenhum jogador ainda.</p>}
    </div>
  );
}
