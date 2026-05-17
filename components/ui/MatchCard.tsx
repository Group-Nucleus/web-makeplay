import Link from 'next/link';

import type { Match } from '@/lib/models/match';

const FALLBACK =
  'https://images.pexels.com/photos/36958045/pexels-photo-36958045.jpeg';

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="group block w-full max-w-[280px] overflow-hidden rounded-2xl bg-[#1A1A1A] transition-transform hover:scale-[1.02]">
      <div className="relative h-[120px] w-full">
        <img
          src={match.image ?? FALLBACK}
          alt={match.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {match.type === 'weekly' && (
            <p className="text-xs text-[#ccc]">Grupo semanal</p>
          )}
          <h3 className="text-lg font-bold text-white">{match.title}</h3>
        </div>
      </div>
      <div className="p-3">
        {match.location && (
          <p className="mb-1 text-sm text-[#888]">
            {match.distance} • {match.location}
          </p>
        )}
        {match.type === 'weekly' && (
          <p className="text-xs text-[#888]">Próximo jogo:</p>
        )}
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
