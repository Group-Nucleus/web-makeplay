'use client';

import { ArrowLeft, Globe, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CreateVenueModal } from '@/components/venue/CreateVenueModal';
import { VenuePickerSheet } from '@/components/venue/VenuePickerSheet';
import { Field, inputClass } from '@/components/ui/Field';
import { useCreateMatch } from '@/lib/hooks/useCreateMatch';
import type { CreateMatchResult } from '@/lib/repositories/match';
import type { MatchType, MatchPrivacy, SportType, Venue } from '@/lib/models/match';
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

interface Props {
  open: boolean;
  type: MatchType;
  onClose: () => void;
  onCreated: (result: CreateMatchResult) => void;
}

export function CreateMatchModal({ open, type, onClose, onCreated }: Props) {
  const vm = useCreateMatch(type, (result) => {
    onCreated(result);
    onClose();
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const isWeekly = type === 'weekly';

  const refreshVenues = () => {
    getPublicVenues().then(setVenues).catch(() => {});
  };

  useEffect(() => {
    if (open) refreshVenues();
  }, [open]);

  const handleVenueCreated = (venue: Venue) => {
    vm.setVenue(venue);
    setVenues((prev) => (prev.some((v) => v.id === venue.id) ? prev : [...prev, venue]));
    setCreateVenueOpen(false);
  };

  if (!open) return null;

  const title = isWeekly ? 'Novo grupo semanal' : 'Novo jogo avulso';

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
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d]">
        <header className="flex items-center gap-3 border-b border-[#2a2a2a] px-5 py-4">
          {vm.step > 1 ? (
            <button
              type="button"
              onClick={() => (vm.step === 2 ? vm.goToStep1() : vm.goToStep2())}
              className="text-[#888] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <h2 className="flex-1 text-center text-sm font-bold tracking-wide text-white">
            {title} — passo {vm.step}/3
          </h2>
          <button type="button" onClick={onClose} className="text-[#888] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {vm.step === 1 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-white">Qual esporte?</h3>
              <p className="mb-5 text-sm text-[#888]">Escolhe o esporte da partida.</p>
              <div className="grid grid-cols-2 gap-3">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => vm.setSport(s.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                      vm.form.sport === s.id
                        ? 'border-[#BFFF00] bg-[#BFFF00]/10'
                        : 'border-[#333] bg-[#1A1A1A] hover:border-[#555]'
                    }`}>
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-sm font-semibold text-white">{s.label}</span>
                  </button>
                ))}
              </div>
              {vm.errors.sport && (
                <p className="mt-2 text-sm text-red-400">{vm.errors.sport}</p>
              )}
            </>
          )}

          {vm.step === 2 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-white">
                {isWeekly ? 'Configura o grupo' : 'Detalhes da partida'}
              </h3>
              <Field label="Nome do jogo" error={vm.errors.name}>
                <input
                  className={inputClass}
                  value={vm.form.name}
                  onChange={(e) => vm.setField('name', e.target.value)}
                  placeholder="Ex: Galera do fut"
                />
              </Field>
              {vm.selectedVenue ? (
                <div className="mb-4 rounded-xl border border-[#333] bg-[#1A1A1A] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#BFFF00]" />
                      <div>
                        <p className="font-semibold text-white">{vm.selectedVenue.name}</p>
                        <p className="truncate text-xs text-[#888]">{vm.selectedVenue.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => vm.setVenue(null)}
                      className="text-[#888] hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setVenuePickerOpen(true)}
                    className="mb-4 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-4 py-3 text-left">
                    <p className="mb-1 text-xs font-bold tracking-wider text-[#888]">QUADRA</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#666]">Selecionar quadra</span>
                      <MapPin className="h-4 w-4 text-[#BFFF00]" />
                    </div>
                  </button>
                  <Field label="Local / endereço" error={vm.errors.location}>
                    <input
                      className={inputClass}
                      value={vm.form.location}
                      onChange={(e) => vm.setField('location', e.target.value)}
                      placeholder="Rua, número, bairro"
                    />
                  </Field>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dia (DD/MM/AAAA)" error={vm.errors.day}>
                  <input
                    className={inputClass}
                    value={vm.form.day}
                    onChange={(e) => vm.setField('day', e.target.value)}
                    placeholder="28/05/2026"
                  />
                </Field>
                <Field label="Horário" error={vm.errors.startTime}>
                  <input
                    className={inputClass}
                    type="time"
                    value={vm.form.startTime}
                    onChange={(e) => vm.setField('startTime', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Duração" error={vm.errors.duration}>
                <select
                  className={inputClass}
                  value={vm.form.duration}
                  onChange={(e) => vm.setField('duration', e.target.value)}>
                  <option value="">Selecionar...</option>
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
                  value={vm.form.gameType}
                  onChange={(e) => vm.setField('gameType', e.target.value)}>
                  <option value="">Selecionar...</option>
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
                  min={2}
                  value={vm.form.spots}
                  onChange={(e) => vm.setField('spots', Number(e.target.value) || 0)}
                />
              </Field>
            </>
          )}

          {vm.step === 3 && (
            <>
              <h3 className="mb-1 text-lg font-bold text-white">Preços e privacidade</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço avulso (R$)" error={vm.errors.pricePerGame}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={vm.form.pricePerGame || ''}
                    onChange={(e) =>
                      vm.setField('pricePerGame', Number(e.target.value) || 0)
                    }
                  />
                </Field>
                <Field label={isWeekly ? 'Preço mensal (R$)' : 'Preço partida (R$)'}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={vm.form.priceMonthly || ''}
                    onChange={(e) =>
                      vm.setField('priceMonthly', Number(e.target.value) || 0)
                    }
                  />
                </Field>
              </div>
              <Field label="Intensidade" error={vm.errors.intensity}>
                <select
                  className={inputClass}
                  value={vm.form.intensity}
                  onChange={(e) => vm.setField('intensity', e.target.value)}>
                  {INTENSITIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Faixa de idade: ${vm.form.ageMin} – ${vm.form.ageMax} anos`}>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="range"
                    min={14}
                    max={59}
                    value={vm.form.ageMin}
                    onChange={(e) => vm.setField('ageMin', Number(e.target.value))}
                    className="w-full accent-[#BFFF00]"
                  />
                  <input
                    type="range"
                    min={15}
                    max={60}
                    value={vm.form.ageMax}
                    onChange={(e) => vm.setField('ageMax', Number(e.target.value))}
                    className="w-full accent-[#BFFF00]"
                  />
                </div>
                {vm.errors.ageMax && (
                  <p className="mt-1 text-xs text-red-400">{vm.errors.ageMax}</p>
                )}
              </Field>
              <p className="mb-2 text-xs font-bold tracking-wider text-[#888]">PRIVACIDADE</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {PRIVACY.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => vm.setPrivacy(p.value)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      vm.form.privacy === p.value
                        ? 'border-[#BFFF00] bg-[#BFFF00]/10'
                        : 'border-[#333] bg-[#1A1A1A]'
                    }`}>
                    <Globe className="mb-1 h-5 w-5 text-[#BFFF00]" />
                    <span className="block text-xs font-bold text-white">{p.label}</span>
                    {p.sub && <span className="text-[10px] text-[#888]">{p.sub}</span>}
                  </button>
                ))}
              </div>
              <label className="mb-3 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={vm.form.hideFromAbsent}
                  onChange={(e) => vm.setField('hideFromAbsent', e.target.checked)}
                  className="mt-1 accent-[#BFFF00]"
                />
                <span className="text-xs text-[#888]">
                  Não exibir para jogadores que faltaram em jogos anteriores
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={vm.form.hidePhoneNumber}
                  onChange={(e) => vm.setField('hidePhoneNumber', e.target.checked)}
                  className="mt-1 accent-[#BFFF00]"
                />
                <span className="text-xs text-[#888]">Ocultar meu telefone nesta partida</span>
              </label>
            </>
          )}
        </div>

        <footer className="border-t border-[#2a2a2a] p-5">
          {vm.submitError && (
            <p className="mb-3 text-center text-sm text-red-400">{vm.submitError}</p>
          )}
          {vm.step === 1 && (
            <button
              type="button"
              onClick={vm.goToStep2}
              className="w-full rounded-xl bg-[#BFFF00] py-3.5 text-sm font-bold text-black">
              CONTINUAR
            </button>
          )}
          {vm.step === 2 && (
            <button
              type="button"
              onClick={vm.goToStep3}
              className="w-full rounded-xl bg-[#BFFF00] py-3.5 text-sm font-bold text-black">
              CONTINUAR
            </button>
          )}
          {vm.step === 3 && (
            <button
              type="button"
              onClick={vm.submit}
              disabled={vm.isSubmitting}
              className="w-full rounded-xl bg-[#BFFF00] py-3.5 text-sm font-bold text-black disabled:opacity-60">
              {vm.isSubmitting
                ? 'A CRIAR...'
                : isWeekly
                  ? 'CRIAR GRUPO'
                  : 'CRIAR PARTIDA'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
