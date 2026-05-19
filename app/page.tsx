'use client';

import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { CreateMatchModal } from '@/components/match/CreateMatchModal';
import { MatchCard } from '@/components/ui/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import type { Match, MatchType } from '@/lib/models/match';
import { useAuth } from '@/lib/auth/context';
import { POLL_HOME_MATCHES_MS } from '@/lib/constants';
import { matchListItemFromApiItem } from '@/lib/mappers/match';
import { groupWeeklyMatchesForHome } from '@/lib/utils/seriesAccess';
import { listMatches } from '@/lib/repositories/match';
import { getUserDocument } from '@/lib/repositories/user';

type Section = { id: 'weekly' | 'oneoff'; data: Match[] };

function mergeMatches(lists: Match[][]): Match[] {
  const map = new Map<string, Match>();
  lists.flat().forEach((m) => map.set(m.id, m));
  return Array.from(map.values()).sort((a, b) => a.nextMatch.localeCompare(b.nextMatch));
}

export default function Page() {
  const router = useRouter();
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
        { id: 'weekly', data: groupWeeklyMatchesForHome(all) },
        { id: 'oneoff', data: all.filter((m) => m.type === 'oneoff' && !m.seriesId) },
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
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <CreateMatchModal
        open={createOpen}
        type={createType}
        onClose={() => setCreateOpen(false)}
        onCreated={(result) => {
          void load();
          if (result.kind === 'weekly') {
            router.push(`/series/${result.seriesId}`);
          }
        }}
      />
      <div className="mb-8 max-w-2xl">
        <p className="mb-1 text-muted">Olá, {greeting}!</p>
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          Marca o teu próximo jogo em minutos
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Reserva quadras, partilha jogos e acompanha as tuas estatísticas
        </p>
      </div>

      <div className="mb-10 flex max-w-md items-center gap-3 rounded-xl bg-card px-4 py-3.5">
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar quadras perto de ti"
          className="flex-1 bg-transparent text-white outline-none placeholder:text-muted"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        sections.map((section) => {
          const data = section.data.filter(filterMatch);
          return (
            <section key={section.id} className="mb-12">
              <div className="mb-4 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  {section.id === 'weekly' ? 'Grupos semanais' : 'Jogos avulsos'}
                </h2>
                <button
                  type="button"
                  onClick={() => openCreate(section.id === 'weekly' ? 'weekly' : 'oneoff')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-lime">
                  {section.id === 'weekly' ? 'Novo grupo' : 'Novo jogo'}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lime">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
              {data.length === 0 ? (
                <p className="px-1 text-sm text-muted">
                  {section.id === 'weekly'
                    ? 'Ainda não tens grupos semanais.'
                    : 'Ainda não tens jogos avulsos.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
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
