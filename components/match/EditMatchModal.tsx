'use client';

import { Globe, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CreateVenueModal } from '@/components/venue/CreateVenueModal';
import { VenuePickerSheet } from '@/components/venue/VenuePickerSheet';
import { Field, inputClass } from '@/components/ui/Field';
import { useEditMatch } from '@/lib/hooks/useEditMatch';
import type { MatchDocument } from '@/lib/models/match-document';
import type { MatchPrivacy, SportType, Venue } from '@/lib/models/match';
import { getPublicVenues } from '@/lib/repositories/venue';

const SPORTS: { id: SportType; label: string; emoji: string }[] = [
  { id: 'soccer', label: 'Futebol', emoji: '⚽' },
  { id: 'volleyball', label: 'Vôlei', emoji: '🏐' },
  { id: 'basketball', label: 'Basquete', emoji: '🏀' },
  { id: 'tennis', label: 'Tênis', emoji: '🎾' },
  { id: 'beach-tennis', label: 'Beach Tennis', emoji: '🏖️' },
  { id: 'padel', label: 'Padel', emoji: '🏓' },
];

const DURATIONS = ['30min', '1h', '1h30', '2h', '2h30', '3h'];
const COURT_TYPES = ['Quadra', 'Areia', 'Grama', 'Grama Sintética', 'Salão', 'Campo'];
const INTENSITIES = ['Resenha', 'Moderado', 'Competitivo'];

const PRIVACY: { value: MatchPrivacy; label: string; sub?: string }[] = [
  { value: 'public', label: 'PÚBLICO' },
  { value: 'friends-of-friends', label: 'AMIGOS', sub: 'DE AMIGOS' },
  { value: 'friends', label: 'AMIGOS' },
  { value: 'invite-only', label: 'CONVIDADOS' },
];

export function EditMatchModal({
  open,
  matchId,
  doc,
  confirmedCount,
  onClose,
  onSaved,
}: {
  open: boolean;
  matchId: string;
  doc: MatchDocument | null;
  confirmedCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const vm = useEditMatch(matchId, doc, confirmedCount, onSaved);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);

  const isWeekly = doc?.type === 'weekly';

  useEffect(() => {
    if (!open || !doc) return;
    vm.resetFromDoc(doc);
    getPublicVenues()
      .then((list) => {
        setVenues(list);
        if (doc.venueId && !vm.selectedVenue) {
          const found = list.find((v) => v.id === doc.venueId);
          if (found) vm.setVenue(found);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ao abrir
  }, [open, doc?.venueId, matchId]);

  if (!open || !doc || !vm.form) return null;

  const form = vm.form;

  const handleVenueCreated = (venue: Venue) => {
    vm.setVenue(venue);
    setVenues((prev) => (prev.some((v) => v.id === venue.id) ? prev : [...prev, venue]));
    setCreateVenueOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <VenuePickerSheet
        open={venuePickerOpen}
        onClose={() => setVenuePickerOpen(false)}
        venues={venues}
        onSelect={(venue) => {
          vm.setVenue(venue);
          setVenuePickerOpen(false);
        }}
        onCreateNew={() => {
          setVenuePickerOpen(false);
          setCreateVenueOpen(true);
        }}
      />
      <CreateVenueModal
        open={createVenueOpen}
        onClose={() => setCreateVenueOpen(false)}
        onCreated={handleVenueCreated}
      />
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-elevated bg-[#0d0d0d]">
        <header className="flex items-center justify-between border-b border-elevated px-5 py-4">
          <h2 className="text-sm font-bold tracking-wide text-white">Editar partida</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="mb-4 text-xs text-muted">
            {confirmedCount > 0
              ? `Mínimo de ${confirmedCount} vagas (jogadores confirmados).`
              : 'Alterações sincronizam o convite público.'}
          </p>

          <p className="mb-2 text-xs font-bold tracking-wider text-muted">ESPORTE</p>
          <div className="mb-5 grid grid-cols-3 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => vm.setSport(s.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
                  form.sport === s.id
                    ? 'border-lime bg-lime/10'
                    : 'border-line bg-card'
                }`}>
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-semibold text-white">{s.label}</span>
              </button>
            ))}
          </div>

          <Field label="Nome" error={vm.errors.name}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => vm.setField('name', e.target.value)}
            />
          </Field>

          {vm.selectedVenue ? (
            <div className="mb-4 rounded-xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                  <div>
                    <p className="font-semibold text-white">{vm.selectedVenue.name}</p>
                    <p className="truncate text-xs text-muted">{vm.selectedVenue.address}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => vm.setVenue(null)}
                  className="text-muted hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setVenuePickerOpen(true)}
                className="mb-4 w-full rounded-xl border border-line bg-card px-4 py-3 text-left">
                <p className="mb-1 text-xs font-bold tracking-wider text-muted">QUADRA</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#666]">Selecionar quadra</span>
                  <MapPin className="h-4 w-4 text-lime" />
                </div>
              </button>
              <Field label="Local / endereço" error={vm.errors.location}>
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(e) => vm.setField('location', e.target.value)}
                />
              </Field>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Dia (DD/MM/AAAA)" error={vm.errors.day}>
              <input
                className={inputClass}
                value={form.day}
                onChange={(e) => vm.setField('day', e.target.value)}
              />
            </Field>
            <Field label="Horário" error={vm.errors.startTime}>
              <input
                className={inputClass}
                type="time"
                value={form.startTime}
                onChange={(e) => vm.setField('startTime', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Duração" error={vm.errors.duration}>
            <select
              className={inputClass}
              value={form.duration}
              onChange={(e) => vm.setField('duration', e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de quadra" error={vm.errors.gameType}>
            <select
              className={inputClass}
              value={form.gameType}
              onChange={(e) => vm.setField('gameType', e.target.value)}>
              {COURT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nº de vagas" error={vm.errors.spots}>
            <input
              className={inputClass}
              type="number"
              min={Math.max(2, confirmedCount)}
              value={form.spots}
              onChange={(e) => vm.setField('spots', Number(e.target.value) || 0)}
            />
          </Field>

          <Field label="Descrição">
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.description}
              onChange={(e) => vm.setField('description', e.target.value)}
              placeholder="Regras, material, como chegar..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço avulso (R$)" error={vm.errors.pricePerGame}>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.pricePerGame}
                onChange={(e) => vm.setField('pricePerGame', Number(e.target.value) || 0)}
              />
            </Field>
            {isWeekly && (
              <Field label="Preço mensal (R$)" error={vm.errors.priceMonthly}>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={form.priceMonthly}
                  onChange={(e) => vm.setField('priceMonthly', Number(e.target.value) || 0)}
                />
              </Field>
            )}
          </div>

          <Field label="Intensidade" error={vm.errors.intensity}>
            <select
              className={inputClass}
              value={form.intensity}
              onChange={(e) => vm.setField('intensity', e.target.value)}>
              {INTENSITIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Faixa etária: ${form.ageMin} – ${form.ageMax} anos`}>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="range"
                min={14}
                max={59}
                value={form.ageMin}
                onChange={(e) => vm.setField('ageMin', Number(e.target.value))}
                className="w-full accent-lime"
              />
              <input
                type="range"
                min={15}
                max={60}
                value={form.ageMax}
                onChange={(e) => vm.setField('ageMax', Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>
          </Field>

          <p className="mb-2 mt-2 text-xs font-bold tracking-wider text-muted">PRIVACIDADE</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {PRIVACY.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => vm.setPrivacy(p.value)}
                className={`rounded-xl border-2 p-3 text-left transition-colors ${
                  form.privacy === p.value
                    ? 'border-lime bg-lime/10'
                    : 'border-line bg-card'
                }`}>
                <Globe className="mb-1 h-5 w-5 text-lime" />
                <span className="block text-xs font-bold text-white">{p.label}</span>
              </button>
            ))}
          </div>

          <label className="mb-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.hideFromAbsent}
              onChange={(e) => vm.setField('hideFromAbsent', e.target.checked)}
              className="mt-1 accent-lime"
            />
            <span className="text-xs text-muted">
              Não exibir para jogadores que faltaram em jogos anteriores
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.hidePhoneNumber}
              onChange={(e) => vm.setField('hidePhoneNumber', e.target.checked)}
              className="mt-1 accent-lime"
            />
            <span className="text-xs text-muted">Ocultar telefone do organizador</span>
          </label>
        </div>

        <footer className="border-t border-elevated p-5">
          {vm.submitError && (
            <p className="mb-3 text-center text-sm text-red-400">{vm.submitError}</p>
          )}
          <button
            type="button"
            onClick={() => void vm.submit()}
            disabled={vm.isSubmitting}
            className="w-full rounded-xl bg-lime py-3.5 text-sm font-bold text-black disabled:opacity-60">
            {vm.isSubmitting ? 'A GUARDAR...' : 'GUARDAR ALTERAÇÕES'}
          </button>
        </footer>
      </div>
    </div>
  );
}
