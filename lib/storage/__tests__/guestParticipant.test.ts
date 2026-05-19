import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearGuestParticipant,
  clearPendingGuestClaimToken,
  getGuestParticipant,
  getPendingGuestClaimToken,
  setGuestParticipant,
  setPendingGuestClaimToken,
} from '@/lib/storage/guestParticipant';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const RECORD = {
  participantId: 'p-1',
  name: 'Visitante Silva',
  status: 'dentro' as const,
  guestToken: 'gt-abc',
};

describe('setGuestParticipant / getGuestParticipant', () => {
  it('persiste e recupera o record corretamente', () => {
    setGuestParticipant('m-1', RECORD);
    expect(getGuestParticipant('m-1')).toEqual(RECORD);
  });

  it('retorna null quando matchId não tem registro', () => {
    expect(getGuestParticipant('m-inexistente')).toBeNull();
  });

  it('isola registros por matchId', () => {
    const other = { ...RECORD, participantId: 'p-2', name: 'Outro' };
    setGuestParticipant('m-1', RECORD);
    setGuestParticipant('m-2', other);
    expect(getGuestParticipant('m-1')?.name).toBe('Visitante Silva');
    expect(getGuestParticipant('m-2')?.name).toBe('Outro');
  });

  it('sobrescreve registro existente para o mesmo matchId', () => {
    setGuestParticipant('m-1', RECORD);
    const updated = { ...RECORD, status: 'lista-espera' as const };
    setGuestParticipant('m-1', updated);
    expect(getGuestParticipant('m-1')?.status).toBe('lista-espera');
  });

  it('retorna null quando JSON no storage é inválido', () => {
    localStorage.setItem('boraplay/guest_participant/m-1', '{bad json}');
    expect(getGuestParticipant('m-1')).toBeNull();
  });
});

describe('clearGuestParticipant', () => {
  it('remove o registro do matchId correto', () => {
    setGuestParticipant('m-1', RECORD);
    clearGuestParticipant('m-1');
    expect(getGuestParticipant('m-1')).toBeNull();
  });

  it('não afeta outros matchIds', () => {
    setGuestParticipant('m-1', RECORD);
    setGuestParticipant('m-2', RECORD);
    clearGuestParticipant('m-1');
    expect(getGuestParticipant('m-2')).toEqual(RECORD);
  });
});

describe('setPendingGuestClaimToken / getPendingGuestClaimToken', () => {
  it('persiste e recupera o token', () => {
    setPendingGuestClaimToken('token-xyz');
    expect(getPendingGuestClaimToken()).toBe('token-xyz');
  });

  it('retorna null quando não há token', () => {
    expect(getPendingGuestClaimToken()).toBeNull();
  });

  it('sobrescreve token existente', () => {
    setPendingGuestClaimToken('token-antigo');
    setPendingGuestClaimToken('token-novo');
    expect(getPendingGuestClaimToken()).toBe('token-novo');
  });
});

describe('clearPendingGuestClaimToken', () => {
  it('remove o token do storage', () => {
    setPendingGuestClaimToken('token-para-apagar');
    clearPendingGuestClaimToken();
    expect(getPendingGuestClaimToken()).toBeNull();
  });
});
