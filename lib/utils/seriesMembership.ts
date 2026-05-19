import { joinSeries } from '@/lib/repositories/match-series';

/** API exige registo na série antes de marcar presença na ocorrência semanal. */
export async function ensureSeriesMembershipInRoster(
  seriesId: string,
  options: { isParticipant: boolean; autoJoinAsMember: boolean },
): Promise<void> {
  if (options.isParticipant || !options.autoJoinAsMember) return;
  await joinSeries(seriesId, 'dentro');
}

export function isSeriesMembershipRequiredError(message: string): boolean {
  return /membros da s[eé]rie|series member/i.test(message);
}
