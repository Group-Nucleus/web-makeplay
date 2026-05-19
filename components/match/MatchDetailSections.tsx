'use client';

import { Check, Lock, MoreVertical, User, X } from 'lucide-react';

import type { ParticipantDocument } from '@/lib/models/match-document';

const SECTION_ACCENTS = {
  dentro: '#BFFF00',
  'lista-espera': '#C4915C',
  fora: '#FF4136',
  convidado: '#0D73EC',
  'aguardando-aprovacao': '#C4915C',
} as const;

export function sectionAccent(status: keyof typeof SECTION_ACCENTS): string {
  return SECTION_ACCENTS[status];
}

export function AttendanceProgress({
  confirmed,
  spots,
  remaining,
  progressPercent,
}: {
  confirmed: number;
  spots: number;
  remaining: number;
  progressPercent: number;
}) {
  return (
    <div className="mb-6 rounded-xl border border-elevated bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-lg font-extrabold text-white">
          {confirmed} <span className="text-xs font-bold text-muted">CONFIRMADOS</span>
        </p>
        <p className="text-lg font-extrabold text-white">
          {remaining} <span className="text-xs font-bold text-muted">VAGAS</span>
        </p>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-lime transition-all duration-300"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>
      <p className="text-xs text-muted">
        Capacidade: {spots} jogadores · {confirmed} confirmados
      </p>
    </div>
  );
}

export function PendingSection({
  players,
  onApprove,
  onReject,
}: {
  players: ParticipantDocument[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (players.length === 0) return null;

  return (
    <ParticipantSection
      title="AGUARDANDO APROVAÇÃO"
      accent={SECTION_ACCENTS['aguardando-aprovacao']}
      count={players.length}>
      {players.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-lg bg-[#141414] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated">
            <User className="h-4 w-4 text-[#666]" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{p.name}</p>
          <button
            type="button"
            onClick={() => onReject(p.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger/40 text-danger"
            aria-label="Recusar">
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onApprove(p.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime text-black"
            aria-label="Aprovar">
            <Check className="h-4 w-4" />
          </button>
        </div>
      ))}
    </ParticipantSection>
  );
}

export function PlayerSection({
  title,
  players,
  accent,
  isOrganizer,
  currentUserId,
  onTogglePaid,
  onManagePlayer,
  organizerUids = [],
  viewerParticipantId,
}: {
  title: string;
  players: ParticipantDocument[];
  accent: string;
  isOrganizer: boolean;
  currentUserId?: string;
  viewerParticipantId?: string | null;
  onTogglePaid: (id: string) => void;
  onManagePlayer?: (id: string) => void;
  organizerUids?: string[];
}) {
  if (players.length === 0) return null;

  const showPaidCol = isOrganizer || players.some((p) => p.uid === currentUserId);

  return (
    <ParticipantSection title={title} accent={accent} count={players.length} showPaidCol={showPaidCol}>
      {players.map((p) => {
        const canSeePaid = isOrganizer || p.uid === currentUserId;
        const canTogglePaid = isOrganizer;
        const isAdmin = !!p.uid && organizerUids.includes(p.uid);
        const isGuest = p.status === 'convidado';
        const isSelf = isViewerSelfInList(
          p,
          isOrganizer,
          currentUserId,
          viewerParticipantId,
        );
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
              isSelf ? SELF_ROW_CLASS : 'bg-[#141414]'
            }`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold text-white">
              {initials(p.name)}
            </div>
            <div className="min-w-0 flex-1">
              {isSelf && <ViewerSelfLabel className="mb-0.5 block" />}
              <p className="truncate text-sm font-medium text-white">{p.name}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {p.position && <p className="text-[10px] text-muted">{p.position}</p>}
                {isAdmin && (
                  <span className="text-[9px] font-bold uppercase text-lime">Admin</span>
                )}
                {isGuest && (
                  <span className="text-[9px] font-bold uppercase text-[#888]">Convidado</span>
                )}
              </div>
            </div>
            {showPaidCol && canSeePaid && (
              <button
                type="button"
                disabled={!canTogglePaid}
                onClick={() => canTogglePaid && onTogglePaid(p.id)}
                className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  p.isPaid
                    ? 'bg-lime/20 text-lime'
                    : 'bg-line text-[#666]'
                } ${!canTogglePaid ? 'cursor-default' : ''}`}>
                {p.isPaid ? 'Pago' : 'Pendente'}
              </button>
            )}
            {isOrganizer && onManagePlayer && (
              <button
                type="button"
                onClick={() => onManagePlayer(p.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-white"
                aria-label={`Gerir ${p.name}`}>
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </ParticipantSection>
  );
}

function ParticipantSection({
  title,
  accent,
  count,
  showPaidCol,
  children,
}: {
  title: string;
  accent: string;
  count: number;
  showPaidCol?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <h3 className="text-xs font-bold tracking-wider text-white">{title}</h3>
        <span className="text-xs font-semibold text-[#666]">{count}</span>
        {showPaidCol && (
          <span className="ml-auto text-[10px] font-bold tracking-wider text-[#666]">PAGO</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function isViewerParticipant(
  p: ParticipantDocument,
  opts: { currentUserId?: string; viewerParticipantId?: string | null },
) {
  if (opts.viewerParticipantId && p.id === opts.viewerParticipantId) return true;
  if (opts.currentUserId && p.uid === opts.currentUserId) return true;
  return false;
}

/** Participante na lista que é o utilizador atual (não organizador). */
function isViewerSelfInList(
  p: ParticipantDocument,
  isOrganizerViewer: boolean,
  currentUserId?: string,
  viewerParticipantId?: string | null,
) {
  return !isOrganizerViewer && isViewerParticipant(p, { currentUserId, viewerParticipantId });
}

const SELF_ROW_CLASS =
  'border border-lime/45 bg-[#141414] ring-1 ring-[#BFFF00]/20';
const SELF_SLOT_CLASS =
  'border border-lime/50 bg-card ring-1 ring-[#BFFF00]/25';

function ViewerSelfLabel({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wide text-[#9A9A9A] ${className}`}>
      Você
    </span>
  );
}

/** Grelha de vagas: convidados sem conta veem vagas ocupadas sem nomes. */
export function MatchSlotsGrid({
  spots,
  filledCount,
  players,
  canSeeNames,
  organizerUid,
  isOrganizerViewer = false,
  currentUserId,
  viewerParticipantId,
}: {
  spots: number;
  filledCount: number;
  players: ParticipantDocument[];
  canSeeNames: boolean;
  organizerUid?: string;
  isOrganizerViewer?: boolean;
  currentUserId?: string;
  viewerParticipantId?: string | null;
}) {
  const freeCount = Math.max(0, spots - filledCount);

  const slotGridClass =
    'grid grid-cols-3 gap-2 min-[380px]:grid-cols-4 sm:grid-cols-4 sm:gap-3 md:grid-cols-5';

  if (canSeeNames) {
    return (
      <div className={slotGridClass}>
        {players.map((p) => {
          const isOrg = organizerUid && p.uid === organizerUid;
          const isGuest = p.status === 'convidado';
          const isSelf = isViewerSelfInList(
            p,
            isOrganizerViewer,
            currentUserId,
            viewerParticipantId,
          );
          return (
            <div
              key={p.id}
              className={`flex min-h-[118px] min-w-0 flex-col items-center justify-center rounded-xl p-2 ${
                isSelf
                  ? SELF_SLOT_CLASS
                  : isOrg
                    ? 'border border-line bg-card ring-2 ring-[#BFFF00]/40'
                    : 'border border-line bg-card'
              }`}>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-xs font-bold text-white">
                {initials(p.name)}
              </div>
              {isSelf && <ViewerSelfLabel className="mb-1" />}
              {isOrg && (
                <span className="mb-1 text-[9px] font-bold text-lime">ORGANIZADOR</span>
              )}
              {isGuest && !isOrg && (
                <span className="mb-1 text-[9px] font-bold uppercase text-[#888]">Convidado</span>
              )}
              <p className="truncate text-center text-xs font-semibold text-white">{p.name}</p>
              <p className="text-[10px] font-bold text-[#666]">CONFIRMADO</p>
            </div>
          );
        })}
        {Array.from({ length: freeCount }).map((_, i) => (
          <EmptySlot key={`free-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className={slotGridClass}>
      {Array.from({ length: Math.min(filledCount, spots) }).map((_, i) => (
        <OccupiedSlot key={`occ-${i}`} />
      ))}
      {Array.from({ length: freeCount }).map((_, i) => (
        <EmptySlot key={`free-${i}`} />
      ))}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex min-h-[118px] min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card p-2">
      <p className="text-center text-[10px] font-bold text-[#666]">VAGA LIVRE</p>
    </div>
  );
}

function OccupiedSlot() {
  return (
    <div className="flex min-h-[118px] min-w-0 flex-col items-center justify-center rounded-xl border border-[#444] bg-[#141414] p-2 opacity-80">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-elevated">
        <Lock className="h-4 w-4 text-[#666]" />
      </div>
      <p className="text-center text-[10px] font-bold text-muted">OCUPADA</p>
    </div>
  );
}
