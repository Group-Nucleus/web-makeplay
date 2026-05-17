'use client';

import { X } from 'lucide-react';
import { useMemo } from 'react';

import { inputClass } from '@/components/ui/Field';

const POSITIONS = ['ATA', 'LE', 'MEI', 'VOL', 'ZAG', 'GOL'];

export type ProfileForm = {
  username: string;
  position: string;
  number: string;
  atk: string;
  def: string;
  str: string;
  skl: string;
};

function ProgressRing({ rating }: { rating: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (rating / 100) * c;
  return (
    <div className="relative mx-auto h-[88px] w-[88px]">
      <svg className="-rotate-90" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#333" strokeWidth="5" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#BFFF00"
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-[#BFFF00]">
        {rating}
      </span>
    </div>
  );
}

interface Props {
  open: boolean;
  form: ProfileForm;
  saving: boolean;
  onChange: (field: keyof ProfileForm, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function ProfileEditModal({ open, form, saving, onChange, onClose, onSave }: Props) {
  const rating = useMemo(() => {
    const vals = [form.atk, form.def, form.str, form.skl].map(Number);
    return Math.round(vals.reduce((a, b) => a + b, 0) / 4);
  }, [form.atk, form.def, form.str, form.skl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#111] border border-[#2a2a2a]">
        <header className="flex items-center justify-between border-b border-[#2a2a2a] px-5 py-4">
          <h2 className="text-lg font-bold text-white">Editar perfil</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-white" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          <label className="mb-1 block text-xs font-bold text-[#888]">USERNAME</label>
          <input
            value={form.username}
            onChange={(e) => onChange('username', e.target.value)}
            className={`${inputClass} mb-4`}
            placeholder="seu_username"
            autoCapitalize="none"
          />

          <label className="mb-2 block text-xs font-bold text-[#888]">POSIÇÃO</label>
          <div className="mb-5 flex flex-wrap gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange('position', p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                  form.position === p ? 'bg-[#BFFF00] text-black' : 'bg-[#2a2a2a] text-[#888]'
                }`}>
                {p}
              </button>
            ))}
          </div>

          <label className="mb-1 block text-xs font-bold text-[#888]">NÚMERO DA CAMISA</label>
          <input
            value={form.number}
            onChange={(e) => onChange('number', e.target.value)}
            className={`${inputClass} mb-5`}
            type="number"
            min={0}
            max={99}
          />

          <label className="mb-3 block text-xs font-bold text-[#888]">ATRIBUTOS</label>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {(['atk', 'def', 'str', 'skl'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#666]">
                  {key}
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#1A1A1A] p-4 text-center">
            <p className="mb-2 text-xs font-bold text-[#888]">RATING CALCULADO</p>
            <ProgressRing rating={rating} />
          </div>
        </div>

        <footer className="border-t border-[#2a2a2a] p-5">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full rounded-xl bg-[#BFFF00] py-3.5 font-bold text-black disabled:opacity-60">
            {saving ? 'A GUARDAR...' : 'SALVAR'}
          </button>
        </footer>
      </div>
    </div>
  );
}
