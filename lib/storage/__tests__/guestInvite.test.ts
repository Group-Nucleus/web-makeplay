import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearGuestInviteContext,
  getGuestInviteContext,
  getPostLoginRedirectPath,
  resolveMatchInviteCode,
  setGuestInviteContext,
} from '@/lib/storage/guestInvite';

// sessionStorage é provido pelo jsdom (environment: 'jsdom' no vitest.config.ts)
beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe('setGuestInviteContext / getGuestInviteContext', () => {
  it('persiste e recupera contexto de match', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-1', code: 'ABC' });
    const ctx = getGuestInviteContext();
    expect(ctx).toEqual({ target: 'match', matchId: 'm-1', code: 'ABC' });
  });

  it('persiste e recupera contexto de series', () => {
    setGuestInviteContext({ target: 'series', seriesId: 's-1', code: 'XYZ' });
    const ctx = getGuestInviteContext();
    expect(ctx).toEqual({ target: 'series', seriesId: 's-1', code: 'XYZ' });
  });

  it('retorna null quando sessionStorage está vazio', () => {
    expect(getGuestInviteContext()).toBeNull();
  });

  it('retorna null quando JSON no storage é inválido', () => {
    sessionStorage.setItem('boraplay_guest_invite', '{invalid json}');
    expect(getGuestInviteContext()).toBeNull();
  });
});

describe('clearGuestInviteContext', () => {
  it('remove o contexto do storage', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-1', code: 'ABC' });
    clearGuestInviteContext();
    expect(getGuestInviteContext()).toBeNull();
  });
});

describe('resolveMatchInviteCode', () => {
  it('retorna o código da URL quando fornecido, normalizado para maiúsculas', () => {
    const code = resolveMatchInviteCode('m-1', 'abc123');
    expect(code).toBe('ABC123');
  });

  it('usa código do storage quando URL não tem código e matchId bate', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-1', code: 'stored' });
    const code = resolveMatchInviteCode('m-1');
    expect(code).toBe('STORED');
  });

  it('usa código da série (sem verificar matchId) quando contexto é de série', () => {
    setGuestInviteContext({ target: 'series', seriesId: 's-1', code: 'serie-code' });
    const code = resolveMatchInviteCode('qualquer-match-id');
    expect(code).toBe('SERIE-CODE');
  });

  it('retorna string vazia quando matchId não bate com contexto de match no storage', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-1', code: 'ABC' });
    const code = resolveMatchInviteCode('m-outro');
    expect(code).toBe('');
  });

  it('retorna string vazia sem storage e sem URL', () => {
    const code = resolveMatchInviteCode('m-1');
    expect(code).toBe('');
  });

  it('código da URL tem prioridade sobre o storage', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-1', code: 'STORAGE' });
    const code = resolveMatchInviteCode('m-1', 'url-code');
    expect(code).toBe('URL-CODE');
  });
});

describe('getPostLoginRedirectPath', () => {
  it('retorna "/" quando não há contexto de invite', () => {
    expect(getPostLoginRedirectPath()).toBe('/');
  });

  it('retorna path do match com código para contexto de match', () => {
    setGuestInviteContext({ target: 'match', matchId: 'm-42', code: 'JOINME' });
    const path = getPostLoginRedirectPath();
    expect(path).toContain('m-42');
    expect(path).toContain('JOINME');
  });

  it('retorna path da série com código para contexto de série', () => {
    setGuestInviteContext({ target: 'series', seriesId: 's-7', code: 'SERIESCODE' });
    const path = getPostLoginRedirectPath();
    expect(path).toContain('s-7');
    expect(path).toContain('SERIESCODE');
  });
});
