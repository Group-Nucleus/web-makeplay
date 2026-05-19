import { describe, expect, it } from 'vitest';

import type { InviteIndexDto } from '@/lib/api/types/match';
import type { SeriesDetailResponseDto, SeriesParticipantDto } from '@/lib/api/types/match-series';
import {
  matchFromSeriesInvite,
  seriesDocumentFromApiDetail,
  seriesParticipantFromApiDto,
} from '@/lib/mappers/match-series';
import { SPORT_IMAGES } from '@/lib/mappers/match';

// ---------------------------------------------------------------------------
// seriesParticipantFromApiDto
// ---------------------------------------------------------------------------

function makeSeriesParticipantDto(overrides?: Partial<SeriesParticipantDto>): SeriesParticipantDto {
  return {
    id: 'sp-1',
    uid: 'uid-1',
    name: 'Jogador Série',
    status: 'dentro',
    isPaid: false,
    addedBy: 'uid-org',
    addedAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('seriesParticipantFromApiDto', () => {
  it('mapeia todos os campos corretamente', () => {
    const dto = makeSeriesParticipantDto({ isPaid: true, position: 'Atacante' });
    const result = seriesParticipantFromApiDto(dto);
    expect(result.id).toBe('sp-1');
    expect(result.uid).toBe('uid-1');
    expect(result.name).toBe('Jogador Série');
    expect(result.status).toBe('dentro');
    expect(result.isPaid).toBe(true);
    expect(result.position).toBe('Atacante');
    expect(result.addedBy).toBe('uid-org');
  });

  it('aceita uid null (participante sem conta)', () => {
    const result = seriesParticipantFromApiDto(makeSeriesParticipantDto({ uid: null }));
    expect(result.uid).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// seriesDocumentFromApiDetail
// ---------------------------------------------------------------------------

function makeSeriesDetailDto(overrides?: Partial<SeriesDetailResponseDto>): SeriesDetailResponseDto {
  return {
    series: {
      id: 'serie-1',
      status: 'active',
      name: 'Futebol dos Amigos',
      sport: 'soccer',
      location: 'Quadra do Clube',
      day: '10/05/2025',
      startTime: '07:00',
      duration: '1h',
      gameType: 'futsal',
      spots: 10,
      ageMin: 18,
      ageMax: 50,
      privacy: 'friends',
      organizers: ['uid-org'],
      createdBy: 'uid-org',
      createdAt: '2025-01-01T00:00:00Z',
      restricted: {
        inviteCode: 'SERIE-CODE',
        pricePerGame: 20,
        priceMonthly: 70,
        intensity: 'Alta',
        hideFromAbsent: true,
        hidePhoneNumber: false,
        description: 'Toda semana',
      },
    },
    viewer: {
      isOrganizer: false,
      isParticipant: false,
      myParticipantId: null,
      myStatus: null,
      canSeeSensitive: false,
    },
    occurrences: [],
    ...overrides,
  };
}

describe('seriesDocumentFromApiDetail', () => {
  it('mapeia campos principais e restricted corretamente', () => {
    const doc = seriesDocumentFromApiDetail(makeSeriesDetailDto());
    expect(doc.type).toBe('weekly');
    expect(doc.name).toBe('Futebol dos Amigos');
    expect(doc.sport).toBe('soccer');
    expect(doc.inviteCode).toBe('SERIE-CODE');
    expect(doc.pricePerGame).toBe(20);
    expect(doc.priceMonthly).toBe(70);
    expect(doc.intensity).toBe('Alta');
    expect(doc.hideFromAbsent).toBe(true);
    expect(doc.hidePhoneNumber).toBe(false);
    expect(doc.description).toBe('Toda semana');
  });

  it('usa valores padrão quando restricted não existe', () => {
    const detail = makeSeriesDetailDto();
    detail.series.restricted = undefined;
    const doc = seriesDocumentFromApiDetail(detail);
    expect(doc.pricePerGame).toBe(0);
    expect(doc.priceMonthly).toBe(0);
    expect(doc.intensity).toBe('');
    expect(doc.hideFromAbsent).toBe(false);
    expect(doc.inviteCode).toBe('');
    expect(doc.description).toBeNull();
  });

  it('converte venueId undefined para undefined no doc', () => {
    const detail = makeSeriesDetailDto();
    detail.series.venueId = undefined;
    const doc = seriesDocumentFromApiDetail(detail);
    expect(doc.venueId).toBeUndefined();
  });

  it('força type como "weekly" independente do DTO', () => {
    const doc = seriesDocumentFromApiDetail(makeSeriesDetailDto());
    expect(doc.type).toBe('weekly');
  });
});

// ---------------------------------------------------------------------------
// matchFromSeriesInvite
// ---------------------------------------------------------------------------

function makeInviteIndexDto(overrides?: Partial<InviteIndexDto>): InviteIndexDto {
  return {
    code: 'SERIE-XYZ',
    target: 'series',
    matchId: null,
    seriesId: 'serie-99',
    type: 'weekly',
    name: 'Pelada da Galera',
    sport: 'volleyball',
    location: 'Quadra da Praia',
    day: '22/06/2025',
    startTime: '15:00',
    duration: '2h',
    spots: 12,
    privacy: 'invite-only',
    ...overrides,
  };
}

describe('matchFromSeriesInvite', () => {
  it('mapeia campos básicos corretamente', () => {
    const result = matchFromSeriesInvite(makeInviteIndexDto());
    expect(result.id).toBe('serie-99');
    expect(result.title).toBe('Pelada da Galera');
    expect(result.privacy).toBe('invite-only');
    expect(result.spots).toBe(12);
    expect(result.type).toBe('weekly');
  });

  it('usa id vazio quando seriesId é null', () => {
    const result = matchFromSeriesInvite(makeInviteIndexDto({ seriesId: null }));
    expect(result.id).toBe('');
  });

  it('usa imagem do esporte correspondente', () => {
    const result = matchFromSeriesInvite(makeInviteIndexDto({ sport: 'volleyball' }));
    expect(result.image).toBe(SPORT_IMAGES.volleyball);
  });

  it('sinaliza hydrateFromInviteRoute como true', () => {
    const result = matchFromSeriesInvite(makeInviteIndexDto());
    expect(result.hydrateFromInviteRoute).toBe(true);
  });

  it('formata nextMatch a partir de day + startTime + duration', () => {
    // 22/06/2025 é domingo
    const result = matchFromSeriesInvite(makeInviteIndexDto({
      day: '22/06/2025',
      startTime: '15:00',
      duration: '2h',
    }));
    expect(result.nextMatch).toBe('22 jun • dom • 15:00 - 17:00');
  });
});
