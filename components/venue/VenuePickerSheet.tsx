'use client';

import { MapPin, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Venue } from '@/lib/models/match';

export function VenuePickerSheet({
  open,
  onClose,
  venues,
  onSelect,
  onCreateNew,
}: {
  open: boolean;
  onClose: () => void;
  venues: Venue[];
  onSelect: (venue: Venue) => void;
  onCreateNew: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        (v.neighborhood?.toLowerCase().includes(q) ?? false),
    );
  }, [venues, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={handleClose}
      role="presentation">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-[#333] bg-[#0d0d0d] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#333] sm:hidden" />
        <div className="flex items-center justify-between border-b border-[#2a2a2a] px-5 py-4">
          <h3 className="text-base font-bold text-white">Escolher quadra</h3>
          <button type="button" onClick={handleClose} className="text-[#888] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-5 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#888]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou endereço..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#888]"
          />
        </div>

        <ul className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-[#888]">Nenhuma quadra encontrada</li>
          ) : (
            filtered.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    onSelect(v);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#1A1A1A]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#BFFF00]" />
                  <span>
                    <span className="block font-semibold text-white">{v.name}</span>
                    <span className="block text-xs text-[#888]">{v.address}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="border-t border-[#2a2a2a] p-4">
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onCreateNew();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BFFF00]/50 py-3 text-sm font-bold text-[#BFFF00]">
            <Plus className="h-4 w-4" />
            Cadastrar nova quadra
          </button>
        </div>
      </div>
    </div>
  );
}
