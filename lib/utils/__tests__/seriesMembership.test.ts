import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/repositories/match-series', () => ({
  joinSeries: vi.fn().mockResolvedValue(undefined),
}));

import { joinSeries } from '@/lib/repositories/match-series';
import { ensureSeriesMembershipInRoster, isSeriesMembershipRequiredError } from '@/lib/utils/seriesMembership';

describe('isSeriesMembershipRequiredError', () => {
  it('reconhece mensagem "membros da série" (sem acento)', () => {
    expect(isSeriesMembershipRequiredError('membros da serie precisam estar no roster')).toBe(true);
  });

  it('reconhece mensagem "membros da série" (com acento)', () => {
    expect(isSeriesMembershipRequiredError('membros da série')).toBe(true);
  });

  it('reconhece mensagem em inglês "series member"', () => {
    expect(isSeriesMembershipRequiredError('series member required')).toBe(true);
  });

  it('é case-insensitive', () => {
    expect(isSeriesMembershipRequiredError('MEMBROS DA SÉRIE')).toBe(true);
    expect(isSeriesMembershipRequiredError('Series Member')).toBe(true);
  });

  it('retorna false para mensagem de erro genérica', () => {
    expect(isSeriesMembershipRequiredError('Erro ao atualizar presença')).toBe(false);
  });

  it('retorna false para string vazia', () => {
    expect(isSeriesMembershipRequiredError('')).toBe(false);
  });

  it('retorna false para mensagem parecida mas sem correspondência exata', () => {
    expect(isSeriesMembershipRequiredError('membro da equipa')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ensureSeriesMembershipInRoster
// ---------------------------------------------------------------------------

describe('ensureSeriesMembershipInRoster', () => {
  it('não chama joinSeries quando já é participante', async () => {
    await ensureSeriesMembershipInRoster('serie-1', { isParticipant: true, autoJoinAsMember: true });
    expect(joinSeries).not.toHaveBeenCalled();
  });

  it('não chama joinSeries quando autoJoinAsMember é false', async () => {
    await ensureSeriesMembershipInRoster('serie-1', { isParticipant: false, autoJoinAsMember: false });
    expect(joinSeries).not.toHaveBeenCalled();
  });

  it('chama joinSeries quando não é participante e autoJoinAsMember é true', async () => {
    await ensureSeriesMembershipInRoster('serie-1', { isParticipant: false, autoJoinAsMember: true });
    expect(joinSeries).toHaveBeenCalledWith('serie-1', 'dentro');
  });
});
