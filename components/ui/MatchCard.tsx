import Link from 'next/link';

import type { Match } from '@/lib/models/match';

const FALLBACK =
  'https://images.pexels.com/photos/36958045/pexels-photo-36958045.jpeg';

function matchHref(match: Match): string {
  if (match.type === 'weekly' || match.seriesId) {
    return `/series/${match.seriesId ?? match.id}`;
  }
  return `/match/${match.id}`;
}

export function MatchCard({ match }: { match: Match }) {
  const isWeekly = match.type === 'weekly' || !!match.seriesId;
  const href = matchHref(match);

  return (
    <Link
      href={href}
      className="group flex min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-[#1A1A1A] transition-transform active:scale-[0.99] md:hover:scale-[1.02]">
      <div className="relative aspect-[16/10] w-full shrink-0">
        <img
          src={match.image ?? FALLBACK}
          alt={match.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {isWeekly && <p className="text-xs text-[#ccc]">Pelada fixa</p>}
          <h3 className="text-lg font-bold text-white">{match.title}</h3>
        </div>
      </div>
      <div className="p-3">
        {match.location && (
          <p className="mb-1 text-sm text-[#888]">
            {match.distance} • {match.location}
          </p>
        )}
        {isWeekly && <p className="text-xs text-[#888]">Próximo jogo:</p>}
        <p className="text-sm font-medium text-white">{match.nextMatch}</p>
        {match.isConfirmed && (
          <div className="mt-3 rounded-lg bg-[#BFFF00]/15 py-2.5 text-center text-sm font-semibold text-[#BFFF00]">
            Estás dentro
          </div>
        )}
      </div>
    </Link>
  );
}
