'use client';

import Link from 'next/link';
import { MapPin, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CreateVenueModal } from '@/components/venue/CreateVenueModal';
import { MatchCard } from '@/components/ui/MatchCard';
import { useAuth } from '@/lib/auth/context';
import { POLL_EXPLORE_MS } from '@/lib/constants';
import { matchListItemFromApiItem } from '@/lib/mappers/match';
import type { MatchListItemDto } from '@/lib/api/types/match';
import type { Match, SportType, Venue } from '@/lib/models/match';
import type { UserDocument } from '@/lib/models/user';
import { listMatches } from '@/lib/repositories/match';
import { listPublicProfiles } from '@/lib/repositories/profile';
import { getPublicVenues } from '@/lib/repositories/venue';

const FILTERS = ['Tudo', 'Jogos', 'Pessoas', 'Quadras'] as const;
type Filter = (typeof FILTERS)[number];

const SPORTS: { key: SportType; label: string; color: string; emoji: string }[] = [
  { key: 'soccer', label: 'Futebol', color: '#1DB954', emoji: '⚽' },
  { key: 'volleyball', label: 'Vôlei', color: '#0D73EC', emoji: '🏐' },
  { key: 'basketball', label: 'Basquete', color: '#E8840C', emoji: '🏀' },
  { key: 'tennis', label: 'Tênis', color: '#AF2896', emoji: '🎾' },
];

export default function Page() {
  const { user, apiSessionReady } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<Filter>('Tudo');
  const [sport, setSport] = useState<SportType | null>(null);
  const [matches, setMatches] = useState<MatchListItemDto[]>([]);
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVenueOpen, setCreateVenueOpen] = useState(false);

  const load = useCallback(async () => {
    if (!apiSessionReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [m, u, v] = await Promise.all([
        listMatches({ privacy: 'public', limit: 60 }),
        listPublicProfiles(60),
        getPublicVenues(60),
      ]);
      setMatches(
        m.items.filter((item) => item.type !== 'weekly' && !item.seriesId),
      );
      setUsers(u);
      setVenues(v);
    } catch (e) {
      console.error('[explore]', e);
    } finally {
      setLoading(false);
    }
  }, [apiSessionReady]);

  useEffect(() => {
    void load();
    if (!apiSessionReady) return;
    const t = setInterval(() => void load(), POLL_EXPLORE_MS);
    return () => clearInterval(t);
  }, [load, apiSessionReady]);

  const text = searchText.toLowerCase().trim();
  const featured = useMemo(() => {
    let src = matches;
    if (sport) src = src.filter((m) => m.sport === sport);
    return src.map(matchListItemFromApiItem);
  }, [matches, sport]);

  const showGames = filter === 'Tudo' || filter === 'Jogos';
  const showPeople = filter === 'Tudo' || filter === 'Pessoas';
  const showVenues = filter === 'Tudo' || filter === 'Quadras';

  return (
    <div className="px-4 py-6 sm:px-6">
      <CreateVenueModal
        open={createVenueOpen}
        onClose={() => setCreateVenueOpen(false)}
        onCreated={() => void load()}
      />
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-card px-4 py-3">
        <Search className="h-[18px] w-[18px] text-muted" />
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar jogos, pessoas, quadras..."
          className="flex-1 bg-transparent text-white outline-none placeholder:text-muted"
        />
        {searchText && (
          <button type="button" onClick={() => setSearchText('')}>
            <XCircle className="h-[18px] w-[18px] text-muted" />
          </button>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filter === f ? 'bg-line text-white' : 'bg-card text-muted'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
        </div>
      ) : (
        <>
          {showGames && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-white">Jogos em destaque</h2>
              {featured.length === 0 ? (
                <p className="text-sm text-muted">Nenhum jogo público disponível</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
                  {featured.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              )}
            </section>
          )}

          {showPeople && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-white">Jogadores em destaque</h2>
              <div className="grid grid-cols-3 gap-3 min-[400px]:grid-cols-4 sm:grid-cols-5">
                {users
                  .filter((u) => u.uid !== user?.uid)
                  .slice(0, 8)
                  .map((u) => (
                    <div
                      key={u.uid}
                      className="flex min-w-0 flex-col items-center rounded-xl bg-card p-3">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-sm font-bold text-white">
                        {(u.displayName || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <p className="truncate text-xs font-semibold text-white">
                        {u.displayName}
                      </p>
                      <p className="text-[10px] text-muted">{u.position ?? '—'}</p>
                      <span className="mt-1 rounded bg-[#C4915C]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#C4915C]">
                        {u.stats?.rating ?? 50}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {showVenues && (
            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-white">Quadras populares</h2>
                {user && (
                  <button
                    type="button"
                    onClick={() => setCreateVenueOpen(true)}
                    className="w-fit shrink-0 rounded-full bg-lime px-4 py-2 text-xs font-bold text-black">
                    + Cadastrar quadra
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl bg-card p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-elevated" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{v.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="h-3 w-3" />
                        {v.address}
                      </p>
                    </div>
                    {v.matchCount != null && (
                      <span className="text-xs text-muted">{v.matchCount} jogos</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
