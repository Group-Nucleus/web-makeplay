'use client';

import type { OccurrenceAttendanceStatus } from '@/lib/api/types/match';
import type { OccurrenceAttendanceSummaryDto } from '@/lib/api/types/match';

export function OccurrenceAttendancePanel({
  myStatus,
  summary,
  busy,
  onSetStatus,
  embedded = false,
}: {
  myStatus: OccurrenceAttendanceStatus | null;
  summary: OccurrenceAttendanceSummaryDto;
  busy?: boolean;
  onSetStatus: (status: 'vou' | 'nao-vou') => void;
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? 'pt-1'
          : 'mb-6 rounded-xl border border-[#2a2a2a] bg-[#1A1A1A] p-4'
      }>
      <h3 className="mb-3 text-xs font-bold tracking-wider text-white">PRESENÇA NESTA SEMANA</h3>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus('vou')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
            myStatus === 'vou'
              ? 'bg-[#BFFF00] text-black'
              : 'border border-[#333] text-white hover:border-[#555]'
          }`}>
          Vou
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus('nao-vou')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
            myStatus === 'nao-vou'
              ? 'bg-[#333] text-white ring-1 ring-[#888]'
              : 'border border-[#333] text-[#888] hover:border-[#555] hover:text-white'
          }`}>
          Não vou
        </button>
      </div>
      <p className="text-xs text-[#888]">
        {summary.vou} vão · {summary.naoVou} não vão · {summary.pendente} pendentes
      </p>
    </section>
  );
}
