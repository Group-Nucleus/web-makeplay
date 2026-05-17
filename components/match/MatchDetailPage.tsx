'use client';

import Link from 'next/link';
import { Calendar, Clock, Copy, Link2, MapPin, Share2, User } from 'lucide-react';
import { useState } from 'react';

import { GuestJoinModal } from '@/components/match/GuestJoinModal';
import {
  AttendanceProgress,
  MatchSlotsGrid,
  PendingSection,
  PlayerSection,
  sectionAccent,
} from '@/components/match/MatchDetailSections';
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

  if (vm.loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
      </div>
    );
  }

  if (vm.error || !vm.match) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="mb-4 text-white">{vm.error || 'Partida não encontrada'}</p>
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

  return (
    <div className="px-6 py-6">
      <GuestJoinModal
        open={vm.guestJoinOpen}
        onClose={() => vm.setGuestJoinOpen(false)}
        onSubmit={vm.handleGuestJoin}
      />

      {vm.shareFeedback && (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-[#BFFF00] px-4 py-2 text-sm font-bold text-black shadow-lg">
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
                <h1 className="text-2xl font-bold text-white">{match.title}</h1>
                {subtitle && <p className="text-sm text-[#ccc]">{subtitle}</p>}
              </div>
            </div>
            <JoinActions vm={vm} hasUser={!!user} canInvite={canInvite} />
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
          <TabBar tab={tab} setTab={setTab} />
          {tab === 'INFO' && (
            <InfoTab vm={vm} organizerUid={vm.organizerUid} />
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

      {vm.isOrganizer ? (
        <div className="rounded-lg border border-[#BFFF00]/40 bg-[#BFFF00]/10 py-3 text-center text-sm font-bold text-[#BFFF00]">
          Você é o organizador
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
          SAIR DA PARTIDA
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

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="mb-6 flex gap-6 border-b border-[#2a2a2a]">
      {(['INFO', 'JOGADORES'] as Tab[]).map((t) => (
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
}: {
  vm: ReturnType<typeof useMatchDetail>;
  organizerUid?: string;
}) {
  return (
  <div>
    <AttendanceProgress
      confirmed={vm.confirmed}
      spots={vm.spots}
      remaining={vm.remaining}
      progressPercent={vm.progressPercent}
    />

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

      {vm.isOrganizer && (
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
        isOrganizer={vm.isOrganizer}
        currentUserId={userId}
        onTogglePaid={(id) => void vm.handleTogglePaid(id)}
      />
      <PlayerSection
        title="LISTA DE ESPERA"
        players={vm.esperaList}
        accent={sectionAccent('lista-espera')}
        isOrganizer={vm.isOrganizer}
        currentUserId={userId}
        onTogglePaid={(id) => void vm.handleTogglePaid(id)}
      />
      <PlayerSection
        title="FORA"
        players={vm.foraList}
        accent={sectionAccent('fora')}
        isOrganizer={vm.isOrganizer}
        currentUserId={userId}
        onTogglePaid={(id) => void vm.handleTogglePaid(id)}
      />
      <PlayerSection
        title="CONVIDADOS"
        players={vm.convidadoList}
        accent={sectionAccent('convidado')}
        isOrganizer={vm.isOrganizer}
        currentUserId={userId}
        onTogglePaid={(id) => void vm.handleTogglePaid(id)}
      />

      {empty && <p className="py-8 text-center text-[#888]">Nenhum jogador ainda.</p>}
    </div>
  );
}
