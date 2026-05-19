'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  busy: boolean;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export function CancelOccurrenceModal({ open, busy, onConfirm, onClose }: Props) {
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(note);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-card p-6 sm:rounded-2xl">
        <h2 className="mb-1 text-base font-bold text-white">Cancelar esta semana</h2>
        <p className="mb-4 text-sm text-muted">
          Os jogadores serão notificados. Esta ação não pode ser desfeita.
        </p>
        <label className="mb-1 block text-xs font-semibold text-muted">
          MOTIVO (OPCIONAL)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Chuva forte prevista..."
          rows={3}
          className="mb-5 w-full resize-none rounded-lg border border-line bg-black px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-lime focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-line py-3 text-sm font-bold text-white disabled:opacity-50">
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 rounded-lg border border-danger/50 py-3 text-sm font-bold text-danger disabled:opacity-50">
            {busy ? 'A cancelar...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
