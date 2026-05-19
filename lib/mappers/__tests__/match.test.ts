import { describe, expect, it } from 'vitest';

import type { InviteIndexDto, MatchDetailResponseDto, MatchListItemDto, ParticipantDto } from '@/lib/api/types/match';
import {
  formatMatchSchedule,
  matchDocumentFromApiDetail,
  matchFromInviteIndexDto,
  matchListItemFromApiItem,
  participantFromApiDto,
  SPORT_IMAGES,
} from '@/lib/mappers/match';

// ---------------------------------------------------------------------------
// formatMatchSchedule
// ---------------------------------------------------------------------------

describe('formatMatchSchedule', () => {
  it('formata corretamente uma data e horário com duração em horas', () => {
    // 14/06/2025 é sábado
    const result = formatMatchSchedule('14/06/2025', '10:00', '1h');
    expect(result).toBe('14 jun • sáb • 10:00 - 11:00');
  });

  it('formata corretamente com duração em minutos', () => {
    const result = formatMatchSchedule('14/06/2025', '09:30', '90min');
    expect(result).toBe('14 jun • sáb • 09:30 - 11:00');
  });

  it('formata corretamente com duração em horas e minutos (ex: 1h30)', () => {
    const result = formatMatchSchedule('14/06/2025', '20:00', '1h30');
    expect(result).toBe('14 jun • sáb • 20:00 - 21:30');
  });

  it('lida com horário que ultrapassa meia-noite (wrap-around)', () => {
    const result = formatMatchSchedule('14/06/2025', '23:00', '2h');
    expect(result).toBe('14 jun • sáb • 23:00 - 01:00');
  });

  it('retorna string vazia quando qualquer campo está ausente', () => {
    expect(formatMatchSchedule('', '10:00', '1h')).toBe('');
    expect(formatMatchSchedule('14/06/2025', '', '1h')).toBe('');
    expect(formatMatchSchedule('14/06/2025', '10:00', '')).toBe('');
  });

  it('inclui zero à esquerda no dia', () => {
    // 05/01/2025 é domingo
    const result = formatMatchSchedule('05/01/2025', '08:00', '1h');
    expect(result).toContain('05 jan');
  });
});

// ---------------------------------------------------------------------------
// matchListItemFromApiItem
// ---------------------------------------------------------------------------

function makeListItemDto(overrides?: Partial<MatchListItemDto>): MatchListItemDto {
  return {
    id: 'match-1',
    type: 'oneoff',
    name: 'Futebol do Bairro',
    sport: 'soccer',
    location: 'Campo Central',
    day: '21/06/2025',
    startTime: '09:00',
    duration: '1h',
    gameType: 'society',
    spots: 14,
    ageMin: 18,
    ageMax: 40,
    privacy: 'public',
    organizers: ['uid-org'],
    createdBy: 'uid-org',
    createdAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('matchListItemFromApiItem', () => {
  it('mapeia campos básicos corretamente', () => {
    const dto = makeListItemDto();
    const result = matchListItemFromApiItem(dto);
    expect(result.id).toBe('match-1');
    expect(result.title).toBe('Futebol do Bairro');
    expect(result.location).toBe('Campo Central');
    expect(result.spots).toBe(14);
    expect(result.privacy).toBe('public');
    expect(result.type).toBe('oneoff');
  });

  it('usa a imagem do esporte correspondente', () => {
    const dto = makeListItemDto({ sport: 'basketball' });
    const result = matchListItemFromApiItem(dto);
    expect(result.image).toBe(SPORT_IMAGES.basketball);
  });

  it('formata nextMatch a partir de day + startTime + duration', () => {
    // 21/06/2025 é sábado
    const dto = makeListItemDto({ day: '21/06/2025', startTime: '09:00', duration: '1h' });
    const result = matchListItemFromApiItem(dto);
    expect(result.nextMatch).toBe('21 jun • sáb • 09:00 - 10:00');
  });

  it('preserva seriesId null quando não presente', () => {
    const dto = makeListItemDto({ seriesId: null });
    const result = matchListItemFromApiItem(dto);
    expect(result.seriesId).toBeNull();
  });

  it('preserva participantStatsPreview quando fornecido', () => {
    const dto = makeListItemDto({
      participantStatsPreview: { dentroCount: 5, listaEsperaCount: 2, aguardandoCount: 1 },
    });
    const result = matchListItemFromApiItem(dto);
    expect(result.participantStatsPreview?.dentroCount).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// matchFromInviteIndexDto
// ---------------------------------------------------------------------------

function makeInviteIndexDto(overrides?: Partial<InviteIndexDto>): InviteIndexDto {
  return {
    code: 'ABC123',
    target: 'match',
    matchId: 'match-99',
    seriesId: null,
    type: 'oneoff',
    name: 'Vôlei na Praia',
    sport: 'volleyball',
    location: 'Praia do Rosa',
    day: '15/07/2025',
    startTime: '16:00',
    duration: '2h',
    spots: 12,
    privacy: 'invite-only',
    ...overrides,
  };
}

describe('matchFromInviteIndexDto', () => {
  it('mapeia campos básicos', () => {
    const dto = makeInviteIndexDto();
    const result = matchFromInviteIndexDto(dto);
    expect(result.id).toBe('match-99');
    expect(result.title).toBe('Vôlei na Praia');
    expect(result.privacy).toBe('invite-only');
    expect(result.spots).toBe(12);
  });

  it('usa id vazio quando matchId é null', () => {
    const dto = makeInviteIndexDto({ matchId: null });
    const result = matchFromInviteIndexDto(dto);
    expect(result.id).toBe('');
  });

  it('sinaliza hydrateFromInviteRoute como true', () => {
    const result = matchFromInviteIndexDto(makeInviteIndexDto());
    expect(result.hydrateFromInviteRoute).toBe(true);
  });

  it('usa imagem correspondente ao esporte', () => {
    const result = matchFromInviteIndexDto(makeInviteIndexDto({ sport: 'tennis' }));
    expect(result.image).toBe(SPORT_IMAGES.tennis);
  });
});

// ---------------------------------------------------------------------------
// matchDocumentFromApiDetail
// ---------------------------------------------------------------------------

function makeDetailResponseDto(overrides?: Partial<MatchDetailResponseDto>): MatchDetailResponseDto {
  return {
    match: {
      id: 'match-1',
      type: 'weekly',
      seriesId: 'serie-1',
      name: 'Futebol Semanal',
      sport: 'soccer',
      location: 'Quadra Municipal',
      day: '07/06/2025',
      startTime: '08:00',
      duration: '1h30',
      gameType: 'futsal',
      spots: 10,
      ageMin: 20,
      ageMax: 45,
      privacy: 'friends',
      organizers: ['uid-org'],
      createdBy: 'uid-org',
      createdAt: '2025-05-01T00:00:00Z',
      restricted: {
        inviteCode: 'INV-XYZ',
        pricePerGame: 25,
        priceMonthly: 80,
        intensity: 'Moderada',
        hideFromAbsent: false,
        hidePhoneNumber: true,
        description: 'Toda semana no sábado',
      },
    },
    participants: [],
    viewer: {
      isOrganizer: false,
      isParticipant: false,
      myParticipantId: null,
      myStatus: null,
      canSeeSensitive: false,
    },
    ...overrides,
  };
}

describe('matchDocumentFromApiDetail', () => {
  it('mapeia campos do match e restricted corretamente', () => {
    const doc = matchDocumentFromApiDetail(makeDetailResponseDto());
    expect(doc.name).toBe('Futebol Semanal');
    expect(doc.inviteCode).toBe('INV-XYZ');
    expect(doc.pricePerGame).toBe(25);
    expect(doc.priceMonthly).toBe(80);
    expect(doc.intensity).toBe('Moderada');
    expect(doc.hidePhoneNumber).toBe(true);
    expect(doc.description).toBe('Toda semana no sábado');
  });

  it('usa seriesId de detail.seriesId com prioridade sobre match.seriesId', () => {
    const detail = makeDetailResponseDto();
    detail.seriesId = 'serie-top-level';
    const doc = matchDocumentFromApiDetail(detail);
    expect(doc.seriesId).toBe('serie-top-level');
  });

  it('usa match.seriesId como fallback quando detail.seriesId é undefined', () => {
    const detail = makeDetailResponseDto();
    detail.seriesId = undefined;
    const doc = matchDocumentFromApiDetail(detail);
    expect(doc.seriesId).toBe('serie-1');
  });

  it('usa valores padrão quando restricted não existe', () => {
    const detail = makeDetailResponseDto();
    detail.match.restricted = undefined;
    const doc = matchDocumentFromApiDetail(detail);
    expect(doc.pricePerGame).toBe(0);
    expect(doc.priceMonthly).toBe(0);
    expect(doc.intensity).toBe('');
    expect(doc.hideFromAbsent).toBe(false);
    expect(doc.inviteCode).toBe('');
    expect(doc.description).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// participantFromApiDto
// ---------------------------------------------------------------------------

function makeParticipantDto(overrides?: Partial<ParticipantDto>): ParticipantDto {
  return {
    id: 'p-1',
    uid: 'uid-player',
    name: 'Jogador Teste',
    status: 'dentro',
    isPaid: false,
    addedBy: 'uid-org',
    addedAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('participantFromApiDto', () => {
  it('mapeia todos os campos corretamente', () => {
    const dto = makeParticipantDto({ isPaid: true, position: 'Goleiro' });
    const result = participantFromApiDto(dto);
    expect(result.id).toBe('p-1');
    expect(result.uid).toBe('uid-player');
    expect(result.name).toBe('Jogador Teste');
    expect(result.status).toBe('dentro');
    expect(result.isPaid).toBe(true);
    expect(result.position).toBe('Goleiro');
  });

  it('aceita uid null (participante guest)', () => {
    const dto = makeParticipantDto({ uid: null, name: 'Convidado Anônimo' });
    const result = participantFromApiDto(dto);
    expect(result.uid).toBeNull();
  });

  it('mantém status de lista-espera', () => {
    const dto = makeParticipantDto({ status: 'lista-espera' });
    expect(participantFromApiDto(dto).status).toBe('lista-espera');
  });
});
