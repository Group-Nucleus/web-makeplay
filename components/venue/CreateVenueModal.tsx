'use client';

import { X } from 'lucide-react';

import { Field, inputClass } from '@/components/ui/Field';
import { useCreateVenue } from '@/lib/hooks/useCreateVenue';
import type { SportType, Venue } from '@/lib/models/match';

const SPORTS: { id: SportType; label: string }[] = [
  { id: 'soccer', label: 'Futebol' },
  { id: 'volleyball', label: 'Vôlei' },
  { id: 'basketball', label: 'Basquete' },
  { id: 'tennis', label: 'Tênis' },
  { id: 'beach-tennis', label: 'Beach Tennis' },
  { id: 'padel', label: 'Padel' },
];

const AMENITIES = [
  { key: 'parking', label: 'Estacionamento' },
  { key: 'changing-room', label: 'Vestiário' },
  { key: 'lighting', label: 'Iluminação' },
  { key: 'shower', label: 'Chuveiro' },
  { key: 'cafe', label: 'Lanchonete' },
  { key: 'wifi', label: 'Wi-Fi' },
];

export function CreateVenueModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (venue: Venue) => void;
}) {
  const vm = useCreateVenue((venue) => {
    onCreated(venue);
    onClose();
  });

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Cadastrar quadra</h2>
        <button type="button" onClick={onClose} className="text-[#888] hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
        <Field label="Nome *" error={vm.errors.name}>
          <input
            className={inputClass}
            value={vm.form.name}
            onChange={(e) => vm.setField('name', e.target.value)}
            placeholder="Nome da quadra"
          />
        </Field>
        <Field label="Endereço *" error={vm.errors.address}>
          <input
            className={inputClass}
            value={vm.form.address}
            onChange={(e) => vm.setField('address', e.target.value)}
            placeholder="Rua, número..."
          />
        </Field>
        <Field label="Bairro">
          <input
            className={inputClass}
            value={vm.form.neighborhood}
            onChange={(e) => vm.setField('neighborhood', e.target.value)}
          />
        </Field>
        <Field label="Cidade">
          <input
            className={inputClass}
            value={vm.form.city}
            onChange={(e) => vm.setField('city', e.target.value)}
          />
        </Field>
        <Field label="Telefone">
          <input
            className={inputClass}
            value={vm.form.phone}
            onChange={(e) => vm.setField('phone', e.target.value)}
          />
        </Field>
        <Field label="Horário">
          <input
            className={inputClass}
            value={vm.form.openingHours}
            onChange={(e) => vm.setField('openingHours', e.target.value)}
            placeholder="Ex: Seg–Sex 8h–22h"
          />
        </Field>

        <p className="mb-2 mt-4 text-xs font-bold tracking-wider text-[#888]">ESPORTES</p>
        <ChipGrid
          items={SPORTS.map((s) => ({
            key: s.id,
            label: s.label,
            selected: vm.form.sports.includes(s.id),
            onClick: () => vm.toggleSport(s.id),
          }))}
        />

        <p className="mb-2 mt-4 text-xs font-bold tracking-wider text-[#888]">COMODIDADES</p>
        <ChipGrid
          items={AMENITIES.map((a) => ({
            key: a.key,
            label: a.label,
            selected: vm.form.amenities.includes(a.key),
            onClick: () => vm.toggleAmenity(a.key),
          }))}
        />

        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-[#1A1A1A] px-4 py-3">
          <span className="text-sm text-white">Visível publicamente</span>
          <input
            type="checkbox"
            checked={vm.form.isPublic}
            onChange={(e) => vm.setField('isPublic', e.target.checked)}
            className="h-5 w-5 accent-[#BFFF00]"
          />
        </label>

        {vm.errors.submit && <p className="mt-2 text-xs text-red-400">{vm.errors.submit}</p>}
      </div>

      <button
        type="button"
        disabled={vm.saving}
        onClick={() => void vm.submit()}
        className="mt-4 w-full rounded-lg bg-[#BFFF00] py-3 text-sm font-bold text-black disabled:opacity-60">
        {vm.saving ? 'CADASTRANDO...' : 'CADASTRAR'}
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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="presentation">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#333] bg-black p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function ChipGrid({
  items,
}: {
  items: { key: string; label: string; selected: boolean; onClick: () => void }[];
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            item.selected ? 'bg-[#BFFF00] text-black' : 'bg-[#1A1A1A] text-[#888]'
          }`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
