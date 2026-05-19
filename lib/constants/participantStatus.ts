import type { ParticipantStatus } from '@/lib/models/match-document';

export const PARTICIPANT_STATUS_LABEL: Record<ParticipantStatus, string> = {
  dentro: 'Dentro',
  'lista-espera': 'Lista de espera',
  fora: 'Fora',
  'aguardando-aprovacao': 'Aguardando aprovação',
};

/** Status que o organizador pode atribuir manualmente. */
export const ORGANIZER_MOVABLE_STATUSES: ParticipantStatus[] = [
  'dentro',
  'lista-espera',
  'fora',
];
