'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { inputClass } from '@/components/ui/Field';

export function GuestJoinModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Entrar na lista</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#888]">
            Só precisas do teu nome. O organizador aprova o pedido. Cria conta depois para
            explorar jogos e amigos.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-[#888]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <input
        className={inputClass}
        placeholder="O teu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        autoFocus
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
        className="mt-4 w-full rounded-lg bg-[#BFFF00] py-3 text-sm font-bold text-black disabled:opacity-50">
        {loading ? 'A enviar...' : 'Pedir para participar'}
      </button>
    </ModalOverlay>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation">
      <div
        className="w-full max-w-md rounded-2xl border border-[#333] bg-[#1A1A1A] p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        {children}
      </div>
    </div>
  );
}
