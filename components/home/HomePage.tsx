'use client';

import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { CreateMatchModal } from '@/components/match/CreateMatchModal';
import { MatchCard } from '@/components/ui/MatchCard';
import type { MatchType } from '@/lib/models/match';
import { useAuth } from '@/lib/auth/context';
import { POLL_HOME_MATCHES_MS } from '@/lib/constants';
import { matchListItemFromApiItem } from '@/lib/mappers/match';
import type { Match } from '@/lib/models/match';
import { listMatches } from '@/lib/repositories/match';
import { getUserDocument } from '@/lib/repositories/user';

type Section = { id: 'weekly' | 'oneoff'; data: Match[] };

function mergeMatches(lists: Match[][]): Match[] {
  const map = new Map<string, Match>();
  lists.flat().forEach((m) => map.set(m.id, m));
  return Array.from(map.values()).sort((a, b) => a.nextMatch.localeCompare(b.nextMatch));
}

export function HomePage() {
  const { user, apiSessionReady } = useAuth();
  const [sections, setSections] = useState<Section[]>([
    { id: 'weekly', data: [] },
    { id: 'oneoff', data: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('jogador');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<MatchType>('weekly');

  const load = useCallback(async () => {
    if (!user?.uid || !apiSessionReady) {
      setSections([
        { id: 'weekly', data: [] },
        { id: 'oneoff', data: [] },
      ]);
      setLoading(false);
      return;
    }
    try {
      const [org, part] = await Promise.all([
        listMatches({ role: 'organizer' }),
        listMatches({ role: 'participant' }),
      ]);
      const all = mergeMatches([
        org.items.map(matchListItemFromApiItem),
        part.items.map(matchListItemFromApiItem),
      ]);
      setSections([
        { id: 'weekly', data: all.filter((m) => m.type === 'weekly') },
        { id: 'oneoff', data: all.filter((m) => m.type === 'oneoff') },
      ]);
    } catch (e) {
      console.error('[home]', e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, apiSessionReady]);

  useEffect(() => {
    void load();
    if (!user?.uid || !apiSessionReady) return;
    const t = setInterval(() => void load(), POLL_HOME_MATCHES_MS);
    return () => clearInterval(t);
  }, [load, user?.uid, apiSessionReady]);

  useEffect(() => {
    if (!user?.uid || !apiSessionReady) return;
    void getUserDocument(user.uid).then((p) => {
      if (p) setGreeting(p.username || p.displayName || 'jogador');
    });
  }, [user?.uid, apiSessionReady]);

  const openCreate = (type: MatchType) => {
    setCreateType(type);
    setCreateOpen(true);
  };

  const filterMatch = (m: Match) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.location?.toLowerCase().includes(q) ?? false)
    );
  };

  return (
    <div className="px-6 py-8">
      <CreateMatchModal
        open={createOpen}
        type={createType}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />
      <div className="mb-8 max-w-2xl">
        <p className="mb-1 text-[#888]">Olá, {greeting}!</p>
        <h1 className="mb-2 text-3xl font-bold text-white">
          Marca o teu próximo jogo em minutos
        </h1>
        <p className="text-sm leading-relaxed text-[#888]">
          Reserva quadras, partilha jogos e acompanha as tuas estatísticas
        </p>
      </div>

      <div className="mb-10 flex max-w-md items-center gap-3 rounded-xl bg-[#1A1A1A] px-4 py-3.5">
        <Search className="h-5 w-5 shrink-0 text-[#888]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar quadras perto de ti"
          className="flex-1 bg-transparent text-white outline-none placeholder:text-[#888]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BFFF00] border-t-transparent" />
        </div>
      ) : (
        sections.map((section) => {
          const data = section.data.filter(filterMatch);
          return (
            <section key={section.id} className="mb-12">
              <div className="mb-4 flex items-center justify-between px-1">
                <h2 className="text-xl font-bold text-white">
                  {section.id === 'weekly' ? 'Grupos semanais' : 'Jogos avulsos'}
                </h2>
                <button
                  type="button"
                  onClick={() => openCreate(section.id === 'weekly' ? 'weekly' : 'oneoff')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#BFFF00]">
                  {section.id === 'weekly' ? 'Novo grupo' : 'Novo jogo'}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#BFFF00]">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
              {data.length === 0 ? (
                <p className="px-1 text-sm text-[#888]">
                  {section.id === 'weekly'
                    ? 'Ainda não tens grupos semanais.'
                    : 'Ainda não tens jogos avulsos.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {data.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
