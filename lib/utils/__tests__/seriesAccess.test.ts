import { describe, expect, it } from 'vitest';

import type { Match } from '@/lib/models/match';
import {
  canAccessPrivateMatch,
  canGuestJoinWithInvite,
  canManageSeries,
  groupWeeklyMatchesForHome,
} from '@/lib/utils/seriesAccess';

// ---------------------------------------------------------------------------
// canManageSeries
// ---------------------------------------------------------------------------

describe('canManageSeries', () => {
  it('retorna true quando canSeeSensitive=true (permissão da API)', () => {
    expect(
      canManageSeries({ isOrganizer: false, organizerUids: [], canSeeSensitive: true }),
    ).toBe(true);
  });

  it('retorna true quando isOrganizer=true', () => {
    expect(
      canManageSeries({ isOrganizer: true, organizerUids: [], canSeeSensitive: false }),
    ).toBe(true);
  });

  it('retorna true quando userId está na lista de organizerUids', () => {
    expect(
      canManageSeries({
        userId: 'uid-admin',
        isOrganizer: false,
        organizerUids: ['uid-outro', 'uid-admin'],
        canSeeSensitive: false,
      }),
    ).toBe(true);
  });

  it('retorna false para espectador comum sem nenhuma permissão', () => {
    expect(
      canManageSeries({
        userId: 'uid-visitante',
        isOrganizer: false,
        organizerUids: ['uid-org'],
        canSeeSensitive: false,
      }),
    ).toBe(false);
  });

  it('retorna false quando userId é undefined e não é organizador', () => {
    expect(
      canManageSeries({
        userId: undefined,
        isOrganizer: false,
        organizerUids: ['uid-org'],
        canSeeSensitive: false,
      }),
    ).toBe(false);
  });

  it('retorna false quando organizerUids está vazio e sem outras permissões', () => {
    expect(
      canManageSeries({
        userId: 'uid-x',
        isOrganizer: false,
        organizerUids: [],
        canSeeSensitive: false,
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canAccessPrivateMatch
// ---------------------------------------------------------------------------

describe('canAccessPrivateMatch', () => {
  it('concede acesso ao organizador independente da privacidade', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'invite-only',
        inviteCode: undefined,
        isOrganizer: true,
        isParticipant: false,
      }),
    ).toBe(true);
  });

  it('concede acesso ao participante independente da privacidade', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'invite-only',
        inviteCode: undefined,
        isOrganizer: false,
        isParticipant: true,
      }),
    ).toBe(true);
  });

  it('concede acesso a match público sem código ou participação', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'public',
        inviteCode: undefined,
        isOrganizer: false,
        isParticipant: false,
      }),
    ).toBe(true);
  });

  it('concede acesso com invite code válido mesmo para match invite-only', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'invite-only',
        inviteCode: 'XPTO123',
        isOrganizer: false,
        isParticipant: false,
      }),
    ).toBe(true);
  });

  it('bloqueia acesso a match invite-only sem código e sem participação', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'invite-only',
        inviteCode: undefined,
        isOrganizer: false,
        isParticipant: false,
      }),
    ).toBe(false);
  });

  it('bloqueia acesso a match friends-only sem código e sem participação', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'friends',
        inviteCode: undefined,
        isOrganizer: false,
        isParticipant: false,
      }),
    ).toBe(false);
  });

  it('bloqueia acesso com invite code vazio para match invite-only', () => {
    expect(
      canAccessPrivateMatch({
        privacy: 'invite-only',
        inviteCode: '',
        isOrganizer: false,
        isParticipant: false,
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canGuestJoinWithInvite
// ---------------------------------------------------------------------------

const BASE_GUEST_OPTIONS = {
  isGuestViewer: true,
  hasLocalGuest: false,
  isParticipant: false,
  accessBlocked: false,
  matchCancelled: false,
  inviteCode: 'ABC123',
  privacy: 'invite-only' as const,
};

describe('canGuestJoinWithInvite', () => {
  it('permite convidado anônimo com código válido em match invite-only', () => {
    expect(canGuestJoinWithInvite(BASE_GUEST_OPTIONS)).toBe(true);
  });

  it('permite convidado anônimo em match público sem código', () => {
    expect(
      canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, inviteCode: '', privacy: 'public' }),
    ).toBe(true);
  });

  it('bloqueia se não é guest viewer (usuário logado)', () => {
    expect(canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, isGuestViewer: false })).toBe(false);
  });

  it('bloqueia se já existe participação local (guest já entrou)', () => {
    expect(canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, hasLocalGuest: true })).toBe(false);
  });

  it('bloqueia se já é participante oficial', () => {
    expect(canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, isParticipant: true })).toBe(false);
  });

  it('bloqueia se acesso está bloqueado pela lógica de privacidade', () => {
    expect(canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, accessBlocked: true })).toBe(false);
  });

  it('bloqueia se a partida foi cancelada', () => {
    expect(canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, matchCancelled: true })).toBe(false);
  });

  it('bloqueia em match invite-only sem código de convite', () => {
    expect(
      canGuestJoinWithInvite({ ...BASE_GUEST_OPTIONS, inviteCode: '', privacy: 'invite-only' }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// groupWeeklyMatchesForHome
// ---------------------------------------------------------------------------

function makeMatch(overrides: Partial<Match> & Pick<Match, 'id'>): Match {
  return {
    type: 'weekly',
    title: `Match ${overrides.id}`,
    nextMatch: '01 jan • seg • 20:00 - 21:00',
    isConfirmed: false,
    spots: 10,
    privacy: 'public',
    ...overrides,
  };
}

describe('groupWeeklyMatchesForHome', () => {
  it('retorna lista vazia para entrada vazia', () => {
    expect(groupWeeklyMatchesForHome([])).toEqual([]);
  });

  it('ignora matches oneoff sem seriesId', () => {
    const m = makeMatch({ id: 'm1', type: 'oneoff', seriesId: null });
    expect(groupWeeklyMatchesForHome([m])).toEqual([]);
  });

  it('agrupa múltiplas ocorrências da mesma série em um único card', () => {
    const m1 = makeMatch({ id: 'occ1', type: 'weekly', seriesId: 'serie-A', nextMatch: '05 jan • dom • 10:00 - 11:00' });
    const m2 = makeMatch({ id: 'occ2', type: 'weekly', seriesId: 'serie-A', nextMatch: '12 jan • dom • 10:00 - 11:00' });
    const result = groupWeeklyMatchesForHome([m1, m2]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('serie-A');
  });

  it('mantém a ocorrência mais próxima (nextMatch menor) para a série', () => {
    const earlier = makeMatch({ id: 'occ-early', type: 'weekly', seriesId: 'serie-B', nextMatch: '03 jan • sex • 08:00 - 09:00' });
    const later = makeMatch({ id: 'occ-late', type: 'weekly', seriesId: 'serie-B', nextMatch: '10 jan • sex • 08:00 - 09:00' });
    const result = groupWeeklyMatchesForHome([later, earlier]);
    expect(result[0].nextMatch).toBe(earlier.nextMatch);
  });

  it('separa ocorrências de séries diferentes', () => {
    const a = makeMatch({ id: 'occ-a', type: 'weekly', seriesId: 'serie-X' });
    const b = makeMatch({ id: 'occ-b', type: 'weekly', seriesId: 'serie-Y' });
    const result = groupWeeklyMatchesForHome([a, b]);
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.id);
    expect(ids).toContain('serie-X');
    expect(ids).toContain('serie-Y');
  });

  it('usa o próprio id como chave de série quando seriesId é null em match weekly', () => {
    const m = makeMatch({ id: 'standalone-weekly', type: 'weekly', seriesId: null });
    const result = groupWeeklyMatchesForHome([m]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('standalone-weekly');
  });

  it('usa seriesId no card resultante', () => {
    const m = makeMatch({ id: 'occ1', type: 'weekly', seriesId: 'serie-Z' });
    const result = groupWeeklyMatchesForHome([m]);
    expect(result[0].seriesId).toBe('serie-Z');
  });
});
