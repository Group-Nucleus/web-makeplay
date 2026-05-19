'use client';

import { Shield, ShieldOff, Trash2, X } from 'lucide-react';

import {
  ORGANIZER_MOVABLE_STATUSES,
  PARTICIPANT_STATUS_LABEL,
} from '@/lib/constants/participantStatus';
import type { ParticipantDocument, ParticipantStatus } from '@/lib/models/match-document';

export function ParticipantManageSheet({
  open,
  player,
  currentStatus,
  onClose,
  onMoveStatus,
  onTogglePaid,
  onRemove,
  isAdmin,
  canPromoteAdmin,
  canDemoteAdmin,
  onPromoteAdmin,
  onDemoteAdmin,
  showAdminControls = false,
  busy,
}: {
  open: boolean;
  player: ParticipantDocument | null;
  currentStatus: ParticipantStatus | null;
  onClose: () => void;
  onMoveStatus: (status: ParticipantStatus) => void;
  onTogglePaid: () => void;
  onRemove: () => void;
  isAdmin?: boolean;
  canPromoteAdmin?: boolean;
  canDemoteAdmin?: boolean;
  onPromoteAdmin?: () => void;
  onDemoteAdmin?: () => void;
  showAdminControls?: boolean;
  busy?: boolean;
}) {
  if (!open || !player) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-line bg-[#141414] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-muted">GERIR JOGADOR</p>
            <h3 className="truncate text-lg font-bold text-white">{player.name}</h3>
            {currentStatus && (
              <p className="mt-1 text-sm text-muted">
                Status atual: {PARTICIPANT_STATUS_LABEL[currentStatus]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-2 text-xs font-bold tracking-wider text-muted">MOVER PARA</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {ORGANIZER_MOVABLE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy || currentStatus === status}
              onClick={() => onMoveStatus(status)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                currentStatus === status
                  ? 'border-lime bg-lime/15 text-lime'
                  : 'border-line text-white hover:border-[#555]'
              }`}>
              {PARTICIPANT_STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onTogglePaid}
          className={`mb-3 w-full rounded-lg py-3 text-sm font-bold ${
            player.isPaid
              ? 'border border-lime text-lime'
              : 'bg-lime text-black'
          } disabled:opacity-50`}>
          {player.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
        </button>

        {showAdminControls && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-bold tracking-wider text-muted">ADMIN</p>
            {isAdmin ? (
              canDemoteAdmin ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDemoteAdmin}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-muted/50 py-3 text-sm font-bold text-dim disabled:opacity-50">
                  <ShieldOff className="h-4 w-4" />
                  Remover como admin
                </button>
              ) : (
                <p className="rounded-lg border border-line bg-card px-3 py-2.5 text-center text-xs text-muted">
                  Este jogador é admin da partida
                </p>
              )
            ) : canPromoteAdmin ? (
              <button
                type="button"
                disabled={busy}
                onClick={onPromoteAdmin}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-lime py-3 text-sm font-bold text-lime disabled:opacity-50">
                <Shield className="h-4 w-4" />
                Tornar admin
              </button>
            ) : (
              <p className="text-xs text-[#666]">
                Só jogadores com conta podem ser admins.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/50 py-3 text-sm font-bold text-danger disabled:opacity-50">
          <Trash2 className="h-4 w-4" />
          Remover da partida
        </button>
      </div>
    </div>
  );
}
